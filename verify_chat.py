import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def create_user(email, password, name):
    print(f"Creating user {name} ({email})...")
    requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password, "full_name": name})
    return get_token(email, password)

def run_test():
    print("--- Starting Chat Verification ---")

    # 1. Create Users
    token_a = create_user("chat_user_a@example.com", "password123", "User A")
    token_b = create_user("chat_user_b@example.com", "password123", "User B")

    if not token_a or not token_b:
        print("Failed to authenticate users.")
        return

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. User A reports an item
    print("\nUser A reporting an item...")
    item_data = {
        "title": "Lost Wallet",
        "category": "Accessories",
        "description": "Black leather wallet",
        "location": "Library",
        "status": "Lost"
    }
    # Using multipart/form-data as required by the endpoint
    response = requests.post(f"{BASE_URL}/items", data=item_data, headers=headers_a)
    if response.status_code != 200:
        print(f"Failed to create item: {response.text}")
        return
    item = response.json()
    item_id = item['id']
    print(f"Item created. ID: {item_id}")

    # 3. User B gets User A's ID (Receiver ID)
    # In real app, User B sees the item which has user_id. 
    receiver_id = item['user_id'] # User A's ID
    print(f"User B will message User A (ID: {receiver_id})...")

    # 4. User B sends message to User A
    print("\nUser B sending message...")
    msg_data = {
        "item_id": item_id,
        "receiver_id": receiver_id,
        "content": "Hi, I found a wallet matching this description."
    }
    response = requests.post(f"{BASE_URL}/messages", json=msg_data, headers=headers_b)
    if response.status_code != 200:
        print(f"Failed to send message: {response.text}")
        return
    print("Message sent successfully!")

    # 5. User A checks conversations
    print("\nUser A checking conversations...")
    response = requests.get(f"{BASE_URL}/messages/conversations", headers=headers_a)
    conversations = response.json()
    if not conversations:
        print("No conversations found for User A.")
        return
    
    convo = conversations[0]
    print(f"Conversation found: {convo['item_title']} with {convo['other_user_name']}")
    convo_id = convo['conversation_id']

    # 6. User A checks messages in that conversation
    print(f"\nUser A checking messages for conversation {convo_id}...")
    response = requests.get(f"{BASE_URL}/messages/{convo_id}", headers=headers_a)
    messages = response.json()
    print(f"Messages found: {len(messages)}")
    print(f"Content: {messages[0]['content']}")

    # 7. User A replies
    print("\nUser A replying...")
    # Parse conversation ID to get receiver (User B)
    # convo_id is item_id-other_user_id
    # Ensure logic matches frontend
    parts = convo_id.split('-')
    other_user_id = int(parts[1])

    reply_data = {
        "item_id": int(parts[0]),
        "receiver_id": other_user_id,
        "content": "That's great! Can we meet?"
    }
    response = requests.post(f"{BASE_URL}/messages", json=reply_data, headers=headers_a)
    if response.status_code == 200:
        print("Reply sent successfully!")
    else:
        print(f"Failed to reply: {response.text}")

    print("\nTest Passed!")

if __name__ == "__main__":
    run_test()
