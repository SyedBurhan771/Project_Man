import os
import requests
import json
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

# Load credentials from your .env file
load_dotenv()

BASE_URL = os.getenv("SAGE_REST_URL")
#USERNAME = os.getenv("SAGE_REST_USER")
USERNAME = "IMPORT"
PASSWORD = os.getenv("SAGE_REST_PWD")

# The exact folder, class, and our NEW representation
FOLDER = "FF"  
CLASS_NAME = "YPRJMASTER"
REP_NAME = "YPRJAPI"

def get_auth():
    return HTTPBasicAuth(USERNAME, PASSWORD)

def get_headers():
    return {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

def get_all_projects():
    """Fetch all projects (GET) using our new clean representation"""
    # Notice we use {CLASS_NAME} for the endpoint, but {REP_NAME} for the representation!
# Adding &orderBy=OPPNUM directly to the URL to fill the blank space and prevent the crash
    url = f"{BASE_URL}/sdata/x3/erp/{FOLDER}/{CLASS_NAME}?representation={REP_NAME}.$query&count=20"
    
    print(f"Attempting to connect to: {url}\n")
    
    response = requests.get(url, auth=("IMPORT", PASSWORD))
    
    if not response.ok:
        print(f"FAILED with status code {response.status_code}")
        print(f"Error details: {response.text}")
        response.raise_for_status()
    
    # Return the clean array of objects
    return response.json().get("$resources", [])

# --- TEST EXECUTION BLOCK ---
if __name__ == "__main__":
    try:
        print("Fetching the list of projects from Sage X3...")
        
        # Call the list function
        projects = get_all_projects()
        
        print(f"\nSUCCESS! Pulled a batch of {len(projects)} projects.")
        
        if projects:
            print("Here is the full data payload for the very first project in the list:\n")
            print(json.dumps(projects[0], indent=4))
        else:
            print("The request worked, but no projects currently exist in the FF database.")
            
    except Exception as e:
        print(f"\nScript stopped due to an error: {e}")