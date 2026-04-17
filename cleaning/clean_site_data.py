import argparse
import html
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def extract_sites(raw_text: str):
    text = raw_text.strip()
    if not text:
        raise ValueError("Input file is empty.")

    # Case 1: the file already contains the JSON array payload.
    if text.startswith("["):
        return json.loads(text)

    # Case 2: the file contains full SOAP XML; extract <resultXml>.
    root = ET.fromstring(text)

    # Use wildcard namespace so this works with or without prefixes.
    result_xml_node = root.find(".//{*}resultXml")
    if result_xml_node is None or not (result_xml_node.text and result_xml_node.text.strip()):
        # Fallback for non-namespaced XML.
        result_xml_node = root.find(".//resultXml")

    if result_xml_node is None or not (result_xml_node.text and result_xml_node.text.strip()):
        raise ValueError("Could not find <resultXml> content in input XML.")

    return json.loads(result_xml_node.text.strip())


def clean_sites(raw_sites):
    final_sites = []
    for site in raw_sites:
        final_sites.append(
            {
                "Company_Info": html.unescape(str(site.get("C1", "")).strip()),
                "Site_Code": str(site.get("FCY", "")).strip(),
                "Site_Name": html.unescape(str(site.get("FCYNAM", "")).strip()),
                "Site_Short_Name": html.unescape(str(site.get("FCYSHO", "")).strip()),
            }
        )
    return final_sites


def main():
    parser = argparse.ArgumentParser(
        description="Clean Sage site data from raw TXT (SOAP XML or raw JSON array) into JSON."
    )
    parser.add_argument(
        "--input",
        default="raw_site.txt",
        help="Path to input txt file (default: raw_site.txt)",
    )
    parser.add_argument(
        "--output",
        default="clean_sites.json",
        help="Path to output json file (default: clean_sites.json)",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    try:
        raw_text = input_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # Common fallback for Windows-authored text files with smart quotes.
        raw_text = input_path.read_text(encoding="cp1252")
    raw_sites = extract_sites(raw_text)
    final_sites = clean_sites(raw_sites)
    output_path.write_text(json.dumps(final_sites, indent=4, ensure_ascii=False), encoding="utf-8")

    print(f"Success! Cleaned {len(final_sites)} sites and saved to {output_path}")


if __name__ == "__main__":
    main()
