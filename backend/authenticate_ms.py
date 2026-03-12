import msal
import os
import json
import sys

# Configuration
CLIENT_ID = "3ac8a5bf-86bb-45e9-a18b-ad5a78fe4c9e"
TENANT_ID = "common" 
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
# Phase-two auth helper for Graph-based inbox automation.
SCOPES = [
    "offline_access",
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/Mail.Send",
]

def authenticate():
    print("--- DappleDoc Microsoft Login ---")
    app = msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY)
    
    print("Initiating Device Code Flow...")
    flow = app.initiate_device_flow(scopes=SCOPES)
    
    if "user_code" not in flow:
        print("❌ Error: Could not start login flow.")
        print(json.dumps(flow, indent=2))
        return

    # This will print the URL and the Code for the user
    print("\n" + "!"*40)
    print(flow["message"])
    print("!"*40 + "\n")
    sys.stdout.flush()

    # This blocks until the user completes the login in their browser
    result = app.acquire_token_by_device_flow(flow)
    
    if "access_token" in result:
        print("\n✅ Authentication Successful!")
        
        # Save to a local file
        token_path = os.path.join(os.path.dirname(__file__), "ms_token.json")
        with open(token_path, "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"Token saved to '{token_path}'.")
        print("\nNext step: upload the refresh token to Modal for phase-two inbox automation.")
    else:
        print("\n❌ Authentication Failed:")
        print(result.get("error_description"))

if __name__ == "__main__":
    authenticate()
