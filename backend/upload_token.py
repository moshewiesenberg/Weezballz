import modal
import json
import os

def upload_token():
    token_path = os.path.join(os.path.dirname(__file__), "ms_token.json")
    if not os.path.exists(token_path):
        print(f"❌ Error: {token_path} not found. Please run authenticate_ms.py first.")
        return

    try:
        with open(token_path, "r") as f:
            token_data = json.load(f)
        
        refresh_token = token_data.get("refresh_token")
        if not refresh_token:
            print("❌ Error: No refresh token found in ms_token.json.")
            return

        storage = modal.Dict.from_name("dappledoc-storage", create_if_missing=True)
        storage["ms_refresh_token"] = refresh_token
        print("✅ Refresh token successfully uploaded to Modal storage!")
        
    except Exception as e:
        print(f"❌ Error uploading token: {e}")

if __name__ == "__main__":
    upload_token()
