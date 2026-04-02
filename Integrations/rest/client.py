import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("SAGE_REST_URL")
USERNAME = os.getenv("SAGE_REST_USER")
PASSWORD = os.getenv("SAGE_REST_PWD")
FOLDER = "FF"  # Your exact endpoint name
CLASS_NAME = "YPRJMASTER"

def get_auth():
    return HTTPBasicAuth(USERNAME, PASSWORD)

def get_headers():
    return {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

def get_all_projects():
    """Fetch all projects (GET)"""
    url = f"{BASE_URL}/sdata/x3/erp/{FOLDER}/{CLASS_NAME}?representation={CLASS_NAME}.$query"
    response = requests.get(url, auth=get_auth(), headers=get_headers(), timeout=15)
    response.raise_for_status()
    
    # Return the clean array of objects
    return response.json().get("$resources", [])

def get_project(project_num):
    """Fetch a single project by ID (GET)"""
    url = f"{BASE_URL}/sdata/x3/erp/{FOLDER}/{CLASS_NAME}('{project_num}')?representation={CLASS_NAME}.$details"
    response = requests.get(url, auth=get_auth(), headers=get_headers(), timeout=15)
    response.raise_for_status()
    return response.json()

def create_project(payload):
    """Create a new project (POST)"""
    url = f"{BASE_URL}/sdata/x3/erp/{FOLDER}/{CLASS_NAME}?representation={CLASS_NAME}.$details"
    response = requests.post(url, auth=get_auth(), headers=get_headers(), json=payload, timeout=15)
    response.raise_for_status()
    return response.json()

def update_project(project_num, payload):
    """Update an existing project (PUT)"""
    url = f"{BASE_URL}/sdata/x3/erp/{FOLDER}/{CLASS_NAME}('{project_num}')?representation={CLASS_NAME}.$details"
    response = requests.put(url, auth=get_auth(), headers=get_headers(), json=payload, timeout=15)
    response.raise_for_status()
    return response.json()