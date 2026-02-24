import requests
import random
import string

API_URL = "http://localhost:8000"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def create_user():
    email = f"{random_string()}@example.com"
    password = "password123"
    full_name = random_string()
    
    # Signup
    res = requests.post(f"{API_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": full_name
    })
    # print(f"Signup {email}: {res.status_code} {res.text}")
    assert res.status_code == 200

    # Login
    res = requests.post(f"{API_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    # print(f"Login {email}: {res.status_code}")
    assert res.status_code == 200
    return res.json()

def test_handover_flow():
    print("Starting Handover Verification Test...")

    # 1. Create Finder
    finder = create_user()
    print(f"Finder created: {finder['id']}")

    # 2. Finder reports an item
    files = {'image': ('test.jpg', b'fake image data', 'image/jpeg')}
    data = {
        'title': 'Test Item',
        'status': 'Found',
        'contact_preference': 'in_app'
    }
    headers = {'Authorization': f"Bearer {finder['access_token']}"}
    
    res = requests.post(f"{API_URL}/items", data=data, files=files, headers=headers)
    if res.status_code != 200:
         print(f"Item Create Failed: {res.status_code} {res.text}")
    print(f"Item Create Response: {res.text}")
    assert res.status_code == 200
    item = res.json()
    item_id = item['id']
    print(f"Item created: {item_id}")

    # 3. Finder generates PIN
    res = requests.post(f"{API_URL}/items/{item_id}/generate_pin", headers=headers)
    if res.status_code != 200:
        print(f"Generate PIN Failed: {res.status_code} {res.text}")
    
    print(f"Generate PIN Response: {res.text}")
    assert res.status_code == 200
    pin_data = res.json()
    pin = pin_data.get('pin')
    if not pin:
        print(f"PIN missing from response: {pin_data}")
        raise ValueError("PIN missing")
    print(f"PIN generated: {pin}")
    assert len(pin) == 4

    # 4. Create Claimer
    claimer = create_user()
    print(f"Claimer created: {claimer['id']}")
    claimer_headers = {'Authorization': f"Bearer {claimer['access_token']}"}

    # 5. Claimer verifies PIN
    res = requests.post(f"{API_URL}/items/{item_id}/verify_pin", json={"pin": pin}, headers=claimer_headers)
    print(f"Verify PIN Response: {res.text}")
    
    if res.status_code != 200:
        print(f"Verification failed: {res.status_code} {res.text}")
    
    assert res.status_code == 200
    assert res.json()['success'] is True
    print("PIN verified successfully")

    # 6. Verify Item Status
    res = requests.get(f"{API_URL}/items/{item_id}")
    updated_item = res.json()
    print(f"Item Status: {updated_item['status']}")
    assert updated_item['status'] == 'Recovered'

    print("Test Passed!")

if __name__ == "__main__":
    try:
        test_handover_flow()
    except Exception as e:
        print(f"Test Failed: {repr(e)}")
