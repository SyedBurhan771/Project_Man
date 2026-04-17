from django.core.cache import cache
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
import json
from pathlib import Path

from Integrations.soap.client import create_opp_project, create_pjm_project, get_sage_master_data, modify_pjm_project
from Integrations.soap.parsers import parse_sage_response
from .models import SoapProjectTransaction, SageCustomer, SageSite


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
        if attrs.get('salesSite') or attrs.get('description') or attrs.get('currency') or attrs.get('customerBP') or attrs.get('openDate'):
            missing = [
                field_name
                for field_name in ('salesSite', 'description', 'currency')
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
            raw_xml_response = modify_pjm_project(payload)
            parsed_result = parse_sage_response(raw_xml_response)
            if parsed_result.get('success') and not parsed_result.get('project_id'):
                parsed_result['project_id'] = project_id
        except Exception as exc:
            parsed_result = {'success': False, 'error': str(exc), 'project_id': project_id}

        _record_transaction(request, SoapProjectTransaction.OPERATION_MODIFY, payload, raw_xml_response, parsed_result)

        if parsed_result.get('success'):
            return Response(parsed_result, status=200)

        return Response(parsed_result, status=400)


# --- MASTER DATA DROPDOWN VIEWS ---

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