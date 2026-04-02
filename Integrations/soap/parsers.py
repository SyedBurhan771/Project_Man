import json
import xml.etree.ElementTree as ET
from typing import Any, Dict, Optional


def _find_text(root: ET.Element, local_name: str) -> Optional[str]:
    for node in root.iter():
        tag = node.tag
        if tag == local_name or tag.endswith(f"}}{local_name}"):
            return (node.text or "").strip()
    return None


def _extract_error_text(result_payload: Any) -> str:
    if isinstance(result_payload, dict):
        messages = result_payload.get("messages") or result_payload.get("MESSAGES")
        if isinstance(messages, list) and messages:
            first = messages[0]
            if isinstance(first, dict):
                for key in ("message", "msg", "text", "MESS"):
                    value = first.get(key)
                    if value:
                        return str(value)
            return str(first)
    return "Sage X3 rejected the payload."


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
        return {
            "success": False,
            "error": "SOAP response missing result payload.",
        }

    try:
        sage_data = json.loads(result_xml_text)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Sage result payload is not valid JSON.",
            "status": status_text,
        }

    if status_text == "1":
        project_id = (
            sage_data.get("PJM0_1", {}).get("OPPNUM")
            if isinstance(sage_data, dict)
            else None
        )
        return {
            "success": True,
            "project_id": project_id,
            "data": sage_data,
        }

    return {
        "success": False,
        "error": _extract_error_text(sage_data),
        "status": status_text,
        "data": sage_data,
    }
