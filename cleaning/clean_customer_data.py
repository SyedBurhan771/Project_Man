import argparse
import html
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def extract_customers(raw_text: str):
    text = raw_text.strip()
    if not text:
        raise ValueError("Input file is empty.")

    # Case 1: input file already contains JSON array.
    if text.startswith("["):
        return json.loads(text)

    # Case 2: input file is SOAP/XML; extract <resultXml>.
    root = ET.fromstring(text)
    result_xml_node = root.find(".//{*}resultXml")
    if result_xml_node is None or not (result_xml_node.text and result_xml_node.text.strip()):
        result_xml_node = root.find(".//resultXml")

    if result_xml_node is None or not (result_xml_node.text and result_xml_node.text.strip()):
        raise ValueError("Could not find <resultXml> content in input XML.")

    return json.loads(result_xml_node.text.strip())


def clean_customers(raw_customers):
    cleaned = []
    for c in raw_customers:
        cleaned.append(
            {
                "Customer_Code": str(c.get("BPCNUM", "")).strip(),
                "Customer_Name": html.unescape(str(c.get("BPCNAM", "")).strip()),
                "Customer_Short_Name": html.unescape(str(c.get("BPCSHO", "")).strip()),
                "Customer_Type_Code": str(c.get("BPCTYP", "")).strip(),
                "Customer_Type_Label": html.unescape(str(c.get("BPCTYP_LBL", "")).strip()),
                "Postal_Code": str(c.get("POSCOD", "")).strip(),
                "Payment_Term": str(c.get("PTE", "")).strip(),
            }
        )
    return cleaned


def main():
    parser = argparse.ArgumentParser(
        description="Convert raw customer TXT (SOAP XML or JSON array) into clean JSON."
    )
    parser.add_argument(
        "--input",
        default="raw_customer.txt",
        help="Input txt file (default: raw_customer.txt)",
    )
    parser.add_argument(
        "--output",
        default="clean_customers.json",
        help="Output json file (default: clean_customers.json)",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    try:
        raw_text = input_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raw_text = input_path.read_text(encoding="cp1252")

    raw_customers = extract_customers(raw_text)
    final_customers = clean_customers(raw_customers)

    output_path.write_text(
        json.dumps(final_customers, indent=4, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Success! Cleaned {len(final_customers)} customers and saved to {output_path}")


if __name__ == "__main__":
    main()
