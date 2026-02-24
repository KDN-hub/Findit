import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def create_user(email, password, name):
    print(f"Creating/Logging in user {name} ({email})...")
    res = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password, "full_name": name})
    if res.status_code == 400 and "Email already registered" in res.text:
        print("User already exists, logging in...")
    elif res.status_code != 200:
        print(f"Failed to create user: {res.text}")
        return None
    return get_token(email, password)

def run_test():
    print("--- Starting Claim Flow Verification ---")

    # 1. Create Users
    token_finder = create_user("finder@example.com", "password123", "Finder User")
    token_claimer = create_user("claimer@example.com", "password123", "Claimer User")

    if not token_finder or not token_claimer:
        print("Failed to authenticate users.")
        return

    headers_finder = {"Authorization": f"Bearer {token_finder}"}
    headers_claimer = {"Authorization": f"Bearer {token_claimer}"}

    # 2. Finder reports an item
    print("\nFinder reporting an item...")
    item_data = {
        "title": "Lost Keys",
        "category": "Keys",
        "description": "Keychain with 3 keys",
        "location": "Cafeteria",
        "status": "Found"
    }
    # Force multipart/form-data by providing empty files
    response = requests.post(f"{BASE_URL}/items", data=item_data, headers=headers_finder, files={})
    if response.status_code != 200:
        print(f"Failed to create item: {response.text}")
        return
    item = response.json()
    item_id = item['id']
    print(f"Item created. ID: {item_id}")

    # 2.5 Test Initiate Conversation (Contact Owner)
    print("\nClaimer initiating conversation (Contact Owner)...")
    init_res = requests.post(f"{BASE_URL}/conversations/initiate", json={"item_id": item_id}, headers=headers_claimer)
    if init_res.status_code == 200:
        init_data = init_res.json()
        print(f"Conversation initiated successfully. ID: {init_data['conversation_id']} (Exists: {init_data['already_exists']})")
    else:
        print(f"Failed to initiate conversation: {init_res.text}")

    # 3. Claimer submits a claim
    print("\nClaimer submitting a claim...")
    claim_data = {
        "item_id": item_id,
        "proof_description": "I lost my keys with a blue lanyard near the juice bar."
    }
    response = requests.post(f"{BASE_URL}/claims", json=claim_data, headers=headers_claimer)
    if response.status_code != 200:
        print(f"Failed to submit claim: {response.text}")
        return
    
    claim_res = response.json()
    print("Claim submitted successfully!")
    print(f"Conversation ID for redirect: {claim_res['conversation_id']}")
    print(f"Finder Name: {claim_res['finder_name']}")

    # 4. Verify system message exists in the conversation
    print("\nChecking message history for system message...")
    convo_id = claim_res['conversation_id']
    response = requests.get(f"{BASE_URL}/messages/{convo_id}", headers=headers_claimer)
    messages = response.json()
    
    if len(messages) > 0:
        print(f"Found {len(messages)} messages.")
        print(f"Initial Message content: {messages[0]['content']}")
        if "has submitted proof" in messages[0]['content']:
            print("System message verification: SUCCESS")
        else:
            print("System message verification: FAILED (Content mismatch)")
    else:
        print("System message verification: FAILED (No messages found)")

    # 5. Verify conversation appears in Finder's list
    print("\nChecking Finder's conversation list...")
    responsed = requests.get(f"{BASE_URL}/messages/conversations", headers=headers_finder)
    if responsed.status_code != 200:
        print(f"Failed to get conversations: {responsed.text}")
        return
        
    conversations = responsed.json()
    print(f"DEBUG: convo_id type: {type(convo_id)}, value: {convo_id}")
    print(f"DEBUG: conversations type: {type(conversations)}")
    if isinstance(conversations, list) and len(conversations) > 0:
         print(f"DEBUG: first convo type: {type(conversations[0])}, content: {conversations[0]}")
    
    try:
        found = any(c['id'] == convo_id for c in conversations)
        if found:
            print("Conversation visible to Finder: SUCCESS")
        else:
            print("Conversation visible to Finder: FAILED")
    except Exception as e:
        print(f"Error checking conversations: {e}")
        import traceback
        traceback.print_exc()
    else:
        print("Conversation visible to Finder: FAILED")

    print("\nClaim Flow Test Passed!")

if __name__ == "__main__":
    run_test()
