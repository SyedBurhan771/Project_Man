from django.core.cache import cache
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
import json
from pathlib import Path

from Integrations.soap.client import create_opp_project, create_pjm_project, get_sage_master_data, modify_pjm_project, create_task, create_sub_task, update_task, update_sub_task
from Integrations.soap.parsers import parse_sage_response
from .models import SoapProjectTransaction, SoapTaskTransaction, SageCustomer, SageSite


def _safe_cache_get(key, default=None):
    try:
        return cache.get(key, default)
    except Exception:
        return default


def _safe_cache_set(key, value, timeout=None):
    try:
        cache.set(key, value, timeout=timeout)
    except Exception:
        # Cache is optional; ignore cache backend outages.
        pass


class CreateProjectSerializer(serializers.Serializer):
    # New OPP payload fields (from Project Details screen)
    projectNumber = serializers.CharField(max_length=40, required=False, allow_blank=True, default='')
    salesSite = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    operatingSite = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    customerBP = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    salesRep = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    currency = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    rateType = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    projectType = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    contactRelation = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    openDate = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    description = serializers.CharField(max_length=250, required=False, allow_blank=True, default='')

    # Legacy payload fields (kept for compatibility)
    site = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    customer = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    short_desc = serializers.CharField(max_length=80, required=False, allow_blank=True, default='')
    sales_rep = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    category = serializers.CharField(max_length=10, required=False, allow_blank=True, default='010')

    def validate(self, attrs):
        # New flow: required minimum fields for OPP creation
        if attrs.get('salesSite') or attrs.get('description')  or attrs.get('customerBP') or attrs.get('openDate'):
            missing = [
                field_name
                for field_name in ('salesSite', 'description')
                if not str(attrs.get(field_name) or '').strip()
            ]
            if missing:
                raise serializers.ValidationError(
                    f"Missing required OPP fields: {', '.join(missing)}"
                )

            raw_date = str(attrs.get('openDate') or '').strip()
            if len(raw_date) == 10 and '/' in raw_date:
                attrs['openDate'] = f"{raw_date[6:10]}{raw_date[3:5]}{raw_date[0:2]}"
            elif len(raw_date) == 10 and '-' in raw_date:
                attrs['openDate'] = f"{raw_date[0:4]}{raw_date[5:7]}{raw_date[8:10]}"
            elif not raw_date:
                attrs['openDate'] = timezone.now().strftime('%Y%m%d')
            else:
                attrs['openDate'] = raw_date

            attrs['_payload_mode'] = 'opp'
            return attrs

        # Legacy flow fallback
        required_legacy = ('site', 'customer', 'description', 'short_desc')
        if any(str(attrs.get(k) or '').strip() for k in required_legacy):
            missing_legacy = [k for k in required_legacy if not str(attrs.get(k) or '').strip()]
            if missing_legacy:
                raise serializers.ValidationError(
                    f"Missing required legacy fields: {', '.join(missing_legacy)}"
                )
            attrs['_payload_mode'] = 'legacy'
            return attrs

        raise serializers.ValidationError(
            'Payload is missing required fields for both OPP and legacy create flows.'
        )


class ModifyProjectSerializer(CreateProjectSerializer):
    project_id = serializers.CharField(max_length=40)


def _record_transaction(request, operation, payload, raw_xml_response, parsed_result):
    SoapProjectTransaction.objects.create(
        operation=operation,
        request_payload=payload,
        response_xml=raw_xml_response,
        parsed_response=parsed_result,
        success=bool(parsed_result.get('success')),
        project_id=str(parsed_result.get('project_id') or payload.get('project_id') or ''),
        soap_status=str(parsed_result.get('status') or ''),
        error_message=str(parsed_result.get('error') or ''),
        requested_by=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
    )


class CreateProjectAPIView(APIView):
    def get(self, request):
        transactions = (
            SoapProjectTransaction.objects
            .filter(operation=SoapProjectTransaction.OPERATION_CREATE, success=True)
            .order_by('-created_at')
        )

        unique_projects = []
        seen_project_ids = set()

        for txn in transactions:
            project_id = str(txn.project_id or '').strip()
            if not project_id or project_id in seen_project_ids:
                continue

            payload = txn.request_payload or {}
            site_value = str(payload.get('site') or payload.get('salesSite') or '').strip()
            customer_value = str(payload.get('customer') or payload.get('customerBP') or '').strip()
            sales_rep_value = str(payload.get('sales_rep') or payload.get('salesRep') or '').strip()
            category_value = str(payload.get('category') or payload.get('projectType') or '').strip()

            unique_projects.append({
                'project_id': project_id,
                'site': site_value,
                'customer': customer_value,
                'description': str(payload.get('description') or '').strip(),
                'short_desc': str(payload.get('short_desc') or '').strip(),
                'category': category_value,
                'sales_rep': sales_rep_value,
                'created_at': txn.created_at,
                
                # New fields for General Tab UI compatibility
                'projectNum': str(payload.get('projectNumber') or project_id),
                'salesSite': site_value,
                'operatingSite': str(payload.get('operatingSite') or ''),
                'customerBP': customer_value,
                'salesRep': sales_rep_value,
                'currency': str(payload.get('currency') or ''),
                'rateType': str(payload.get('rateType') or ''),
                'projectType': str(payload.get('projectType') or ''),
                'contactRelation': str(payload.get('contactRelation') or ''),
                'openDate': str(payload.get('openDate') or ''),
                'projectName': str(payload.get('short_desc') or payload.get('projectName') or payload.get('description') or '').strip()[:80],
            })
            seen_project_ids.add(project_id)

        return Response({'success': True, 'projects': unique_projects}, status=200)
    
    def post(self, request):
        print("=== RAW REQUEST DATA FROM FRONTEND ===")
        print(json.dumps(request.data, indent=2))
        print("=====================================")

        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data

        # === AUTO GENERATE PROJECT NUMBER IF EMPTY ===
        if not payload.get('projectNumber'):
            today = timezone.now().strftime('%Y%m%d')
            payload['projectNumber'] = f"OPP-{today}-001"   # You can improve this logic later

        print("=== FINAL PAYLOAD AFTER AUTO PROJECT NUMBER ===")
        print(json.dumps(payload, indent=2))
        print("==============================================")

        raw_xml_response = ''
        parsed_result = {}

        try:
            payload_mode = payload.get('_payload_mode')
            
            if payload_mode == 'opp':
                opp_data = {
                    "project_number": payload.get('projectNumber', ''),
                    "sales_site":     payload.get('salesSite', ''),
                    "operating_site": payload.get('operatingSite', ''),
                    "customer_bp":    payload.get('customerBP', ''),
                    "sales_rep_new":  payload.get('salesRep', ''),
                    "currency":       payload.get('currency', ''),
                    "rate_type":      payload.get('rateType', ''),
                    "project_type":   payload.get('projectType', ''),
                    "contact_relation": payload.get('contactRelation', ''),
                    "open_date":      payload.get('openDate', ''),
                    "description":    payload.get('description', ''),
                    "pool_alias":     "APDEMO",
                }
                
                print("=== OPP DATA SENT TO SAGE ===")
                print(json.dumps(opp_data, indent=2))
                print("=============================")
                
                raw_xml_response = create_opp_project(opp_data)
                
            else:
                raw_xml_response = create_pjm_project(payload)
                
            parsed_result = parse_sage_response(raw_xml_response)
            
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc)}

        _record_transaction(request, SoapProjectTransaction.OPERATION_CREATE, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=201)

        return Response(parsed_result, status=400)
class ModifyProjectAPIView(APIView):
    def put(self, request, project_id):
        payload_data = {**request.data, 'project_id': project_id}
        serializer = ModifyProjectSerializer(data=payload_data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data
        raw_xml_response = ''
        parsed_result = {}

        try:
            # Map frontend camelCase fields to snake_case expected by client.py
            mapped_payload = {
                'project_id': payload.get('project_id', ''),
                'sales_site': payload.get('salesSite', '') or payload.get('site', ''),
                'operating_site': payload.get('operatingSite', ''),
                'customer_bp': payload.get('customerBP', '') or payload.get('customer', ''),
                'sales_rep': payload.get('salesRep', '') or payload.get('sales_rep', ''),
                'project_type': payload.get('projectType', '') or payload.get('category', ''),
                'description': payload.get('description', ''),
                'short_desc': payload.get('short_desc', ''),
            }
            raw_xml_response = modify_pjm_project(mapped_payload)
            parsed_result = parse_sage_response(raw_xml_response)
            if parsed_result.get('success') and not parsed_result.get('project_id'):
                parsed_result['project_id'] = project_id
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc), 'project_id': project_id}

        _record_transaction(request, SoapProjectTransaction.OPERATION_MODIFY, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=200)

        return Response(parsed_result, status=400)


class CreateTaskSerializer(serializers.Serializer):
    oppnum = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tcacod = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tascod = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tasfcy = serializers.CharField(max_length=20, required=False, allow_blank=True)
    tasdesaxx = serializers.CharField(max_length=80, required=False, allow_blank=True)
    tasdesax1 = serializers.CharField(max_length=80, required=False, allow_blank=True)
    tasstartdt = serializers.CharField(max_length=10, required=False, allow_blank=True)
    tasenddt = serializers.CharField(max_length=10, required=False, allow_blank=True)
    tasdur = serializers.CharField(max_length=10, required=False, allow_blank=True)

    oppNum = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tcaCod = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tasCod = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tasFcy = serializers.CharField(max_length=20, required=False, allow_blank=True)
    tasDesAxx = serializers.CharField(max_length=80, required=False, allow_blank=True)
    tasDesAx1 = serializers.CharField(max_length=80, required=False, allow_blank=True)
    tasStartDt = serializers.CharField(max_length=10, required=False, allow_blank=True)
    tasEndDt = serializers.CharField(max_length=10, required=False, allow_blank=True)
    tasDur = serializers.CharField(max_length=10, required=False, allow_blank=True)

    def validate(self, attrs):
        mapped = {}
        for key in ['oppnum', 'tcacod', 'tascod', 'tasfcy', 'tasdesaxx', 'tasdesax1', 'tasstartdt', 'tasenddt', 'tasdur']:
            if key == 'oppnum': camel_key = 'oppNum'
            elif key == 'tcacod': camel_key = 'tcaCod'
            elif key == 'tascod': camel_key = 'tasCod'
            elif key == 'tasfcy': camel_key = 'tasFcy'
            elif key == 'tasdesaxx': camel_key = 'tasDesAxx'
            elif key == 'tasdesax1': camel_key = 'tasDesAx1'
            elif key == 'tasstartdt': camel_key = 'tasStartDt'
            elif key == 'tasenddt': camel_key = 'tasEndDt'
            elif key == 'tasdur': camel_key = 'tasDur'

            mapped[key] = str(attrs.get(key) or attrs.get(camel_key) or '').strip()
            
        if not mapped.get('oppnum') or not mapped.get('tascod'):
            raise serializers.ValidationError("oppnum (project ID) and tascod (task ID) are required fields.")
            
        # Format dates to MM/DD/YY as expected by Sage X3 AOWSIMPORT (Confirmed by working SOAP UI example)
        for date_field in ['tasstartdt', 'tasenddt']:
            raw_date = mapped.get(date_field)
            if len(raw_date) == 10 and '/' in raw_date:
                # DD/MM/YYYY -> MM/DD/YY
                mapped[date_field] = f"{raw_date[3:5]}/{raw_date[0:2]}/{raw_date[8:10]}"
            elif len(raw_date) == 10 and '-' in raw_date:
                # YYYY-MM-DD -> MM/DD/YY
                mapped[date_field] = f"{raw_date[5:7]}/{raw_date[8:10]}/{raw_date[2:4]}"
            elif len(raw_date) == 8 and '-' not in raw_date:
                # YYYYMMDD -> MM/DD/YY
                mapped[date_field] = f"{raw_date[4:6]}/{raw_date[6:8]}/{raw_date[2:4]}"
            elif not raw_date:
                mapped[date_field] = timezone.now().strftime('%m/%d/%y')

        return mapped


class CreateSubTaskSerializer(CreateTaskSerializer):
    taspae = serializers.CharField(max_length=40, required=False, allow_blank=True)
    tasPaen = serializers.CharField(max_length=40, required=False, allow_blank=True) # camelCase version if needed

    def validate(self, attrs):
        mapped = super().validate(attrs)
        # Add taspae to mapped data
        mapped['taspae'] = str(attrs.get('taspae') or attrs.get('tasPaen') or '').strip()
        
        if not mapped.get('taspae'):
            raise serializers.ValidationError("taspae (Parent Task ID) is required for sub-tasks.")
            
        return mapped


class UpdateTaskSerializer(CreateTaskSerializer):
    def validate(self, attrs):
        mapped = super().validate(attrs)
        # For update, we still need oppnum and tascod as identifiers
        return mapped


class UpdateSubTaskSerializer(CreateSubTaskSerializer):
    def validate(self, attrs):
        mapped = super().validate(attrs)
        # For sub-task update, we need taspae as well (handled by super)
        return mapped


def _record_task_transaction(request, operation, payload, raw_xml_response, parsed_result):
    SoapTaskTransaction.objects.create(
        operation=operation,
        request_payload=payload,
        response_xml=raw_xml_response,
        parsed_response=parsed_result,
        success=bool(parsed_result.get('success')),
        project_id=str(parsed_result.get('project_id') or payload.get('oppnum') or ''),
        task_id=str(parsed_result.get('task_id') or payload.get('tascod') or ''),
        soap_status=str(parsed_result.get('status') or ''),
        error_message=str(parsed_result.get('error') or ''),
        requested_by=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
    )


class CreateTaskAPIView(APIView):
    def get(self, request):
        oppnum = request.query_params.get('oppnum')
        transactions = (
            SoapTaskTransaction.objects
            .filter(success=True)
            .order_by('-created_at')
        )

        unique_tasks = []
        seen_task_ids = set()

        for txn in transactions:
            payload = txn.request_payload or {}
            txn_oppnum = str(payload.get('oppnum') or '').strip()
            
            if oppnum and txn_oppnum != oppnum:
                continue

            task_id = str(txn.task_id or '').strip()
            if not task_id or task_id in seen_task_ids:
                continue
                
            unique_tasks.append({
                'taskCode': task_id,
                'category': str(payload.get('tcacod') or ''),
                'status': '1', # default active
                'startDate': str(payload.get('tasstartdt') or ''),
                'endDate': str(payload.get('tasenddt') or ''),
                'progress': 0,
                'budgetLink': '',
                'personResponsible': '',
                'systemId': task_id,
                'description': str(payload.get('tasdesaxx') or ''),
                'shortDesc': str(payload.get('tasdesax1') or ''),
                'duration': str(payload.get('tasdur') or ''),
                'fcy': str(payload.get('tasfcy') or ''),
                'parentCode': str(payload.get('taspae') or ''),
                'oppnum': txn_oppnum,
                'created_at': txn.created_at,
            })
            seen_task_ids.add(task_id)

        return Response({'success': True, 'tasks': unique_tasks}, status=200)

    def post(self, request):
        serializer = CreateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data

        print("=== VALIDATED PAYLOAD FOR SAGE X3 TASK CREATE ===")
        print(json.dumps(payload, indent=2))
        print("================================================")

        raw_xml_response = ''
        parsed_result = {}

        try:
            raw_xml_response = create_task(payload)
            parsed_result = parse_sage_response(raw_xml_response)
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc)}

        _record_task_transaction(request, SoapTaskTransaction.OPERATION_CREATE, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=201)

        return Response(parsed_result, status=400)


class CreateSubTaskAPIView(APIView):
    def post(self, request):
        serializer = CreateSubTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data

        print("=== VALIDATED PAYLOAD FOR SAGE X3 SUB-TASK CREATE ===")
        print(json.dumps(payload, indent=2))
        print("===================================================")

        raw_xml_response = ''
        parsed_result = {}

        try:
            raw_xml_response = create_sub_task(payload)
            parsed_result = parse_sage_response(raw_xml_response)
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc)}

        _record_task_transaction(request, SoapTaskTransaction.OPERATION_CREATE, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=201)

        return Response(parsed_result, status=400)


class UpdateTaskAPIView(APIView):
    def put(self, request, task_id):
        # Inject task_id from URL into data if not present
        data = request.data.copy()
        if 'tascod' not in data and 'tasCod' not in data:
            data['tascod'] = task_id

        serializer = UpdateTaskSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data

        print(f"=== VALIDATED PAYLOAD FOR SAGE X3 TASK UPDATE [{task_id}] ===")
        print(json.dumps(payload, indent=2))
        print("==========================================================")

        raw_xml_response = ''
        parsed_result = {}

        try:
            raw_xml_response = update_task(payload)
            parsed_result = parse_sage_response(raw_xml_response)
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc)}

        _record_task_transaction(request, SoapTaskTransaction.OPERATION_MODIFY, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=200)

        return Response(parsed_result, status=400)


class UpdateSubTaskAPIView(APIView):
    def put(self, request, task_id):
        data = request.data.copy()
        if 'tascod' not in data and 'tasCod' not in data:
            data['tascod'] = task_id

        serializer = UpdateSubTaskSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data

        print(f"=== VALIDATED PAYLOAD FOR SAGE X3 SUB-TASK UPDATE [{task_id}] ===")
        print(json.dumps(payload, indent=2))
        print("=============================================================")

        raw_xml_response = ''
        parsed_result = {}

        try:
            raw_xml_response = update_sub_task(payload)
            parsed_result = parse_sage_response(raw_xml_response)
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc)}

        _record_task_transaction(request, SoapTaskTransaction.OPERATION_MODIFY, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=200)

        return Response(parsed_result, status=400)


# --- MASTER DATA DROPDOWN VIEWS ---
# Force reload

class CustomerDropdownView(APIView):
    def get(self, request):
        cached_customers = _safe_cache_get('sage_customers')
        if cached_customers:
            return Response(cached_customers, status=200)

        try:
            raw_customers = get_sage_master_data('BPC', limit=30)
            formatted_customers = [
                {"id": str(c['code']), "label": f"{c['code']} - {c['description']}"}
                for c in raw_customers
                if str(c.get('code') or '').strip()
            ]
        except Exception:
            json_path = Path(__file__).parent / 'data' / 'customers.json'
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8') as f:
                    customers_raw = json.load(f)
                formatted_customers = [
                    {
                        "id": str(c.get('Customer_Code') or '').strip(),
                        "label": f"{str(c.get('Customer_Code') or '').strip()} - {str(c.get('Customer_Name') or '').strip()}"
                    }
                    for c in customers_raw
                    if str(c.get('Customer_Code') or '').strip()
                ]
            else:
                formatted_customers = []

        _safe_cache_set('sage_customers', formatted_customers, timeout=86400)
        return Response(formatted_customers, status=200)


class SiteDropdownView(APIView):
    def get(self, request):
        cached_sites = _safe_cache_get('sage_sites')
        if cached_sites:
            return Response(cached_sites, status=200)

        try:
            raw_sites = get_sage_master_data('WSFCY', limit=30)
            formatted_sites = [
                {"id": str(s['code']), "label": f"{s['code']} - {s['description']}"}
                for s in raw_sites
                if str(s.get('code') or '').strip()
            ]
        except Exception:
            json_path = Path(__file__).parent / 'data' / 'sites.json'
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8') as f:
                    sites_raw = json.load(f)
                formatted_sites = [
                    {
                        "id": str(s.get('Site_Code') or '').strip(),
                        "label": f"{str(s.get('Site_Code') or '').strip()} - {str(s.get('Site_Name') or '').strip()}"
                    }
                    for s in sites_raw
                    if str(s.get('Site_Code') or '').strip()
                ]
            else:
                formatted_sites = []

        _safe_cache_set('sage_sites', formatted_sites, timeout=86400)
        return Response(formatted_sites, status=200)


class SyncMasterDataAPIView(APIView):
    def post(self, request):
        try:
            customers = get_sage_master_data('BPC', limit=30)
            for customer in customers:
                code = str(customer.get('code') or '').strip()
                if not code:
                    continue
                SageCustomer.objects.update_or_create(
                    code=code,
                    defaults={'description': str(customer.get('description') or '').strip()},
                )

            sites = get_sage_master_data('WSFCY', limit=30)
            for site in sites:
                code = str(site.get('code') or '').strip()
                if not code:
                    continue
                SageSite.objects.update_or_create(
                    code=code,
                    defaults={'description': str(site.get('description') or '').strip()},
                )

            return Response(
                {
                    'success': True,
                    'message': f'Successfully synced {len(customers)} Customers and {len(sites)} Sites.',
                },
                status=200,
            )
        except Exception as exc:
            return Response({'success': False, 'error': str(exc)}, status=500)