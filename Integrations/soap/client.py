import os
import json
from typing import Any, Dict
import xml.etree.ElementTree as ET

import requests
from requests.adapters import HTTPAdapter
from requests.auth import HTTPBasicAuth
from urllib3.util.retry import Retry


DEFAULT_TIMEOUT_SECONDS = 20


def _load_template(template_name: str) -> str:
    template_path = os.path.join(os.path.dirname(__file__), 'templates', template_name)
    with open(template_path, 'r', encoding='utf-8') as file:
        return file.read()

def _render_template(xml_template: str, data: Dict[str, Any]) -> str:
    """Render XML template by replacing placeholders with actual values"""
    
    placeholders = {
        'pool_alias': str(os.getenv('SAGE_POOL_ALIAS', 'APDEMO')).strip() or 'APDEMO',
        
        # OPP fields (snake_case)
        'project_number': str(data.get('project_number', '')).strip(),
        'sales_site': str(data.get('sales_site', '')).strip(),
        'operating_site': str(data.get('operating_site', '')).strip(),
        'customer_bp': str(data.get('customer_bp', '')).strip(),
        'sales_rep_new': str(data.get('sales_rep_new', '')).strip(),
        'currency': str(data.get('currency', '')).strip(),
        'rate_type': str(data.get('rate_type', '')).strip(),
        'project_type': str(data.get('project_type', '')).strip(),
        'contact_relation': str(data.get('contact_relation', '')).strip(),
        'open_date': str(data.get('open_date', '')).strip(),
        'description': str(data.get('description', '')).strip(),
        
        # NEW: camelCase versions to match the updated XML template
        'salesSite': str(data.get('sales_site', '')).strip(),
        'customerBp': str(data.get('customer_bp', '')).strip(),
        'projectType': str(data.get('project_type', '')).strip(),
        'salesRep': str(data.get('sales_rep', '')).strip(),
        
        # Task fields
        'POOL_ALIAS': str(os.getenv('SAGE_POOL_ALIAS', 'APDEMO')).strip() or 'APDEMO',
        'OPPNUM': str(data.get('oppnum', '')).strip(),
        'TCACOD': str(data.get('tcacod', '')).strip(),
        'TASCOD': str(data.get('tascod', '')).strip(),
        'TASFCY': str(data.get('tasfcy', '')).strip(),
        'TASDESAXX': str(data.get('tasdesaxx', '')).strip(),
        'TASDESAX1': str(data.get('tasdesax1', '')).strip(),
        'TASSTARTDT': str(data.get('tasstartdt', '')).strip(),
        'TASENDDT': str(data.get('tasenddt', '')).strip(),
        'TASDUR': str(data.get('tasdur', '1')).strip(),
        'TASPAE': str(data.get('taspae', '')).strip(),

        
        # Legacy fields (as backup)
        'project_id': str(data.get('project_id', '')).strip(),
        'site': str(data.get('site', '')).strip(),
        'customer': str(data.get('customer', '')).strip(),
        'sales_rep': str(data.get('sales_rep', '')).strip(),
        'short_desc': str(data.get('short_desc', '')).strip(),
        'category': str(data.get('category', '010')).strip() or '010',
    }

    print("=== PLACEHOLDERS BEING USED IN RENDER ===")
    print(json.dumps(placeholders, indent=2))
    print("=========================================")

    payload = xml_template
    for key, value in placeholders.items():
        old = f'{{{key}}}'
        if old in payload:
            payload = payload.replace(old, value)
            print(f"Replaced {{{key}}} → {value}")
        else:
            print(f"Placeholder {{{key}}} NOT FOUND in template")

    return payload


def _build_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        status=2,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(['POST']),
        backoff_factor=0.5,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session


def _send_soap_request(payload: str, soap_action: str) -> str:
    url = os.getenv(
        'SAGE_SOAP_URL',
        'http://167.86.77.23:8124/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC',
    ).strip()
    username = os.getenv('SAGE_SOAP_USER', '').strip()
    password = os.getenv('SAGE_SOAP_PWD', '').strip()
    timeout = int(os.getenv('SAGE_SOAP_TIMEOUT', str(DEFAULT_TIMEOUT_SECONDS)))

    if not username or not password:
        raise ValueError('SAGE SOAP credentials are missing. Set SAGE_SOAP_USER and SAGE_SOAP_PWD.')

    headers = {
        'Content-Type': 'text/xml; charset=UTF-8',
        'SOAPAction': soap_action,
    }

    session = _build_session()
    response = session.post(
        url,
        data=payload.encode('utf-8'),
        headers=headers,
        auth=HTTPBasicAuth(username, password),
        timeout=timeout,
    )
    response.raise_for_status()
    return response.text


def create_pjm_project(data: Dict[str, Any]) -> str:
    xml_template = _load_template('save_request.xml')
    payload = _render_template(xml_template, data)
    
    # === ADD THESE LINES HERE ===
    print("=== FINAL XML PAYLOAD FOR PJM PROJECT ===")
    print(payload)
    print("========================================\n")
    
    return _send_soap_request(payload, soap_action='save')


def create_opp_project(data: Dict[str, Any]) -> str:
    xml_template = _load_template('save_opp_request.xml')
    payload = _render_template(xml_template, data)
    
    # === ADD THESE LINES HERE ===
    print("=== FINAL XML PAYLOAD FOR OPP PROJECT ===")
    print(payload)
    print("========================================\n")
    
    return _send_soap_request(payload, soap_action='save')

def modify_pjm_project(data: Dict[str, Any]) -> str:
    if not str(data.get('project_id', '')).strip():
        raise ValueError('project_id is required for modify operation.')

    xml_template = _load_template('modify_request.xml')
    payload = _render_template(xml_template, data)
    return _send_soap_request(payload, soap_action='modify')


def get_sage_master_data(public_name: str, limit: int = 30):
    """
    Fetches master data (Customers or Sites) from Sage X3.
    public_name: 'BPC' for Customers, 'WSFCY' for Sales Sites.
    """
    xml_template = _load_template('codes_data.xml')
    xml_payload = xml_template.format(public_name=public_name, limit=limit)

    response_text = _send_soap_request(xml_payload, soap_action='query')

    root = ET.fromstring(response_text)
    result_xml_node = root.find('.//{*}resultXml') or root.find('.//resultXml')
    if result_xml_node is None or not result_xml_node.text:
        return []

    raw_data = json.loads(result_xml_node.text)
    if isinstance(raw_data, dict):
        raw_data = raw_data.get('result') or raw_data.get('items') or raw_data.get('data') or []
    if not isinstance(raw_data, list):
        return []

    formatted_data = []

    for item in raw_data:
        if not isinstance(item, dict):
            continue
        if public_name == "BPC":
            code = str(item.get("BPCNUM") or "").strip()
            description = str(item.get("BPCNAM") or "").strip()
            if not code:
                continue
            formatted_data.append({
                "code": code,
                "description": description
            })
        elif public_name == "WSFCY":
            code = str(item.get("FCY") or "").strip()
            description = str(item.get("FCYNAM") or "").strip()
            if not code:
                continue
            formatted_data.append({
                "code": code,
                "description": description
            })

    return formatted_data

def create_task(data: Dict[str, Any]) -> str:
    xml_template = _load_template('task_request.xml')
    payload = _render_template(xml_template, data)
    
    print("=== FINAL XML PAYLOAD FOR TASK CREATE ===")
    print(payload)
    print("========================================\n")
    
    return _send_soap_request(payload, soap_action='run')
def create_sub_task(data: Dict[str, Any]) -> str:
    xml_template = _load_template('sub_task_request.xml')
    payload = _render_template(xml_template, data)
    
    print("=== FINAL XML PAYLOAD FOR SUB-TASK CREATE ===")
    print(payload)
    print("============================================\n")
    
    return _send_soap_request(payload, soap_action='run')

def update_task(data: Dict[str, Any]) -> str:
    xml_template = _load_template('update_task_request.xml')
    payload = _render_template(xml_template, data)
    
    print("=== FINAL XML PAYLOAD FOR TASK UPDATE ===")
    print(payload)
    print("========================================\n")
    
    return _send_soap_request(payload, soap_action='run')


def update_sub_task(data):
    xml_template = _load_template('update_subtask_request.xml')
    payload = _render_template(xml_template, data)
    
    print("=== FINAL XML PAYLOAD FOR SUB-TASK UPDATE ===")
    print(payload)
    print("============================================\n")
    
    return _send_soap_request(payload, soap_action='run')
