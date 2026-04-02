from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from Integrations.soap.client import create_pjm_project, modify_pjm_project
from Integrations.soap.parsers import parse_sage_response
from .models import SoapProjectTransaction


class CreateProjectSerializer(serializers.Serializer):
    site = serializers.CharField(max_length=20)
    customer = serializers.CharField(max_length=30)
    description = serializers.CharField(max_length=250)
    short_desc = serializers.CharField(max_length=80)
    sales_rep = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    category = serializers.CharField(max_length=10, required=False, allow_blank=True, default='010')


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
            unique_projects.append({
                'project_id': project_id,
                'site': str(payload.get('site') or '').strip(),
                'customer': str(payload.get('customer') or '').strip(),
                'description': str(payload.get('description') or '').strip(),
                'short_desc': str(payload.get('short_desc') or '').strip(),
                'category': str(payload.get('category') or '').strip(),
                'sales_rep': str(payload.get('sales_rep') or '').strip(),
                'created_at': txn.created_at,
            })
            seen_project_ids.add(project_id)

        return Response({'success': True, 'projects': unique_projects}, status=200)

    def post(self, request):
        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data
        raw_xml_response = ''
        parsed_result = {}

        try:
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
