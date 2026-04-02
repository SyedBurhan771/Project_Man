import os
from typing import Any, Dict

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
    placeholders = {
        'project_id': str(data.get('project_id', '')).strip(),
        'site': str(data.get('site', '')).strip(),
        'description': str(data.get('description', '')).strip(),
        'short_desc': str(data.get('short_desc', '')).strip(),
        'customer': str(data.get('customer', '')).strip(),
        'sales_rep': str(data.get('sales_rep', '')).strip(),
        'category': str(data.get('category', '010')).strip() or '010',
    }

    payload = xml_template
    for key, value in placeholders.items():
        payload = payload.replace(f'{{{key}}}', value)

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
    return _send_soap_request(payload, soap_action='save')


def modify_pjm_project(data: Dict[str, Any]) -> str:
    if not str(data.get('project_id', '')).strip():
        raise ValueError('project_id is required for modify operation.')

    xml_template = _load_template('modify_request.xml')
    payload = _render_template(xml_template, data)
    return _send_soap_request(payload, soap_action='modify')
