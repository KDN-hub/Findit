from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from pydantic import BaseModel
from database import get_db_connection
from auth_utils import get_current_user, create_access_token, set_auth_cookies
import pymysql
import os
import json
from config import RP_ID, RP_ORIGIN

# We import from webauthn package
from webauthn import generate_registration_options, verify_registration_response
from webauthn import generate_authentication_options, verify_authentication_response
from webauthn.helpers.structs import (
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialType
)
from webauthn.helpers.options_to_json import options_to_json

router = APIRouter(prefix="/auth/webauthn", tags=["WebAuthn"])

# Temporary in-memory cache to hold options/challenges between generation and verification.
# In production with multiple workers, this MUST be Redis or a database table!
webauthn_challenges = {}

# We rely on "id" for standard users
class RegistrationVerifyRequest(BaseModel):
    response: dict

class AuthenticationVerifyRequest(BaseModel):
    email: str
    response: dict

@router.post("/register/generate-options")
def generate_registration_options_route(current_user: dict = Depends(get_current_user)):
    """
    Called by an authenticated user who wants to enroll a new fingerprint/device.
    """
    user_id = str(current_user["id"])
    user_email = current_user.get("sub", current_user.get("email", ""))
    
    # We create options
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name="Findit App",
        user_id=user_id.encode("utf-8"),
        user_name=user_email,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )
    
    # Store challenge by user_id
    webauthn_challenges[user_id] = options.challenge

    return json.loads(options_to_json(options))


@router.post("/register/verify")
def verify_registration_route(data: RegistrationVerifyRequest, db = Depends(get_db_connection), current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    expected_challenge = webauthn_challenges.get(user_id)
    
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Challenge not found or expired")

    try:
        verification = verify_registration_response(
            credential=data.response,
            expected_challenge=expected_challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGIN,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    # Clear challenge
    del webauthn_challenges[user_id]

    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        # Check if user already has a credential with this ID (unlikely but safe)
        credential_id_str = verification.credential_id.hex()
        
        import base64
        public_key_b64 = base64.b64encode(verification.credential_public_key).decode('utf-8')

        insert_query = """
        INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            current_user["id"],
            credential_id_str,
            public_key_b64,
            verification.sign_count
        ))
        db.commit()
    except pymysql.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()

    return {"message": "Biometric registration successful"}

class AuthenticateOptionsRequest(BaseModel):
    email: str

@router.post("/authenticate/generate-options")
def generate_authentication_options_route(data: AuthenticateOptionsRequest, db = Depends(get_db_connection)):
    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        cursor.execute("SELECT credential_id FROM webauthn_credentials WHERE user_id = %s", (user["id"],))
        credentials = cursor.fetchall()
        
        if not credentials:
            raise HTTPException(status_code=400, detail="No biometric credentials registered for this account")

        # Allow any of the user's registered credentials
        allow_credentials = [
            PublicKeyCredentialDescriptor(
                type=PublicKeyCredentialType.PUBLIC_KEY,
                id=bytes.fromhex(c["credential_id"])
            ) for c in credentials
        ]
        
        options = generate_authentication_options(
            rp_id=RP_ID,
            allow_credentials=allow_credentials,
            user_verification=UserVerificationRequirement.PREFERRED
        )
        
        webauthn_challenges[data.email] = options.challenge
        return json.loads(options_to_json(options))
    finally:
        cursor.close()

@router.post("/authenticate/verify")
def verify_authentication_route(data: AuthenticationVerifyRequest, response: Response, db = Depends(get_db_connection)):
    expected_challenge = webauthn_challenges.get(data.email)
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Challenge not found or expired")

    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.get("is_suspended") in (1, True):
            raise HTTPException(status_code=403, detail="Account suspended")

        # Get credential from DB to verify against
        raw_id = data.response.get("id", "")
        # Assuming the raw_id is base64url encoded. webauthn-py handles parsing inside verify_authentication_response,
        # but we need to fetch the matching public key from our DB.
        
        # It's easier to find the credential by ID. In standard WebAuthn, `data.response["id"]` is a base64url string.
        # But we saved `credential_id` as a hex string. Let's find the credential matching this rawId or we check all.
        cursor.execute("SELECT * FROM webauthn_credentials WHERE user_id = %s", (user["id"],))
        db_creds = cursor.fetchall()
        
        if not db_creds:
             raise HTTPException(status_code=400, detail="No credentials found")

        # Let's map credentials by their hex string for webauthn-py
        # webauthn-py `verify_authentication_response` takes a `credential_public_key` and `sign_count`.
        # However, how do we know which credential they used? 
        # `data.response.id` is the base64url encoded credential_id.
        import base64
        # fix padding if needed
        b64_id = data.response["id"]
        padding_needed = 4 - (len(b64_id) % 4)
        if padding_needed and padding_needed != 4:
            b64_id += "=" * padding_needed
        b64_id = b64_id.replace('-', '+').replace('_', '/')
        
        try:
            used_credential_id_hex = base64.b64decode(b64_id).hex()
        except:
            raise HTTPException(status_code=400, detail="Invalid credential ID format")
            
        target_cred = next((c for c in db_creds if c["credential_id"] == used_credential_id_hex), None)
        
        if not target_cred:
             raise HTTPException(status_code=400, detail="Unrecognized credential used")

        public_key_bytes = base64.b64decode(target_cred["public_key"])

        verification = verify_authentication_response(
            credential=data.response,
            expected_challenge=expected_challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGIN,
            credential_public_key=public_key_bytes,
            credential_current_sign_count=target_cred["sign_count"]
        )

        # Update sign count
        cursor.execute("UPDATE webauthn_credentials SET sign_count = %s WHERE id = %s", (verification.new_sign_count, target_cred["id"]))
        db.commit()

        # Login success! Clear challenge
        del webauthn_challenges[data.email]

        # Issue access token
        is_admin = user.get("is_admin") in (1, True) or (user.get("role") or "").lower() == "admin"
        access_token = create_access_token(data={
            "sub": user["email"],
            "id": user["id"],
            "role": user["role"],
            "is_admin": is_admin,
            "full_name": user.get("full_name"),
        })

        set_auth_cookies(response, access_token)

        # Optional: send login alert
        from email_service import send_login_alert_email
        from fastapi import BackgroundTasks
        # We can't easily inject BackgroundTasks here unless we add it to the route signature
        
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user["avatar_url"],
            "role": user["role"],
            "auth_provider": user["auth_provider"],
            "is_admin": is_admin,
            "access_token": access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    finally:
        cursor.close()
