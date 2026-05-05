import json
import xml.etree.ElementTree as ET
from typing import Any, Dict, Optional


def _find_text(root: ET.Element, local_name: str) -> Optional[str]:
    needle = str(local_name).lower()
    for node in root.iter():
        tag = node.tag
        if "}" in tag:
            tag = tag.split("}", 1)[1]
        if str(tag).lower() == needle:
            return (node.text or "").strip()
    return None


def _extract_fault_text(root: ET.Element) -> Optional[str]:
    for name in ("faultstring", "message", "errormessage", "description"):
        value = _find_text(root, name)
        if value:
            return value
    return None


def _extract_error_text(result_payload: Any) -> str:
    if isinstance(result_payload, dict):
        messages = result_payload.get("messages") or result_payload.get("MESSAGES")
        if isinstance(messages, list) and messages:
            lines = []
            for msg in messages:
                if isinstance(msg, dict):
                    for key in ("message", "msg", "text", "MESS"):
                        value = msg.get(key)
                        if value:
                            lines.append(str(value))
                            break
                else:
                    lines.append(str(msg))
            if lines:
                return " | ".join(lines)
    return "Sage X3 rejected the payload."


def _find_key_deep(payload: Any, key_name: str) -> Optional[str]:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if str(key).upper() == key_name.upper() and value not in (None, ''):
                return str(value)
            nested = _find_key_deep(value, key_name)
            if nested:
                return nested
    elif isinstance(payload, list):
        for item in payload:
            nested = _find_key_deep(item, key_name)
            if nested:
                return nested
    return None


def parse_sage_response(xml_string: str) -> Dict[str, Any]:
    try:
        root = ET.fromstring(xml_string)
    except ET.ParseError:
        return {
            "success": False,
            "error": "Invalid SOAP XML response from Sage X3.",
        }

    status_text = _find_text(root, "status")
    result_xml_text = _find_text(root, "resultXml")

    if status_text is None:
        return {
            "success": False,
            "error": "SOAP response missing status field.",
        }

    if not result_xml_text:
        if status_text == "1":
            return {
                "success": True,
                "project_id": None,
                "data": {},
                "warning": "SOAP response missing result payload.",
            }
        fault_text = _extract_fault_text(root)
        return {
            "success": False,
            "error": fault_text or "SOAP response missing result payload.",
            "status": status_text,
        }

    try:
        sage_data = json.loads(result_xml_text)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Sage result payload is not valid JSON.",
            "status": status_text,
        }

    error_text = _extract_error_text(sage_data)

    # Only trust status codes — never infer success from message text
    if status_text in ("1", "2"):
        project_id = _find_key_deep(sage_data, "OPPNUM")
        task_id = _find_key_deep(sage_data, "TASCOD")

        return {
            "success": True,
            "project_id": project_id,
            "task_id": task_id,
            "data": sage_data,
            "warning": error_text if error_text and error_text != "Sage X3 rejected the payload." else None
        }

    return {
        "success": False,
        "error": error_text,
        "status": status_text,
        "data": sage_data,
    }