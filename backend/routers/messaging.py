from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import mysql.connector
import random
from datetime import datetime

# Adjust imports based on file structure
# Since this file is in backend/routers/messaging.py
# and database.py is in backend/database.py
# Adjust imports based on file structure
# Since this file is in backend/routers/messaging.py
# and database.py is in backend/database.py
# When running from backend/, these modules are in sys.path
from database import get_db_connection
from auth_utils import get_current_user
from schemas import (
    StartClaimRequest,
    SendMessageRequest,
    RequestIdentityRequest,
    SubmitIdentityRequest,
    InitiateHandoverRequest,
    ConfirmHandoverRequest,
    RejectClaimRequest,
    ClaimResponse,
    MessageResponse
)

router = APIRouter()

# ──────────────────────────────────────────────────────────
# CLAIMS
# ──────────────────────────────────────────────────────────

@router.post("/claims/start")
def start_claim(
    request: StartClaimRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    """
    Step 1: User clicks "Claim This Item".
     Creates a claim record and starts the conversation.
    """
    cursor = db.cursor(dictionary=True)
    try:
        current_user_id = current_user['id']
        
        # 1. Get item and finder
        cursor.execute("SELECT id, user_id, title FROM items WHERE id = %s", (request.item_id,))
        item = cursor.fetchone()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
            
        finder_id = item['user_id']
        
        if current_user_id == finder_id:
             raise HTTPException(status_code=400, detail="You cannot claim your own item")
             
        # 2. Check for existing active claim
        cursor.execute("""
            SELECT id FROM claims 
            WHERE item_id = %s AND claimer_id = %s AND status != 'rejected'
        """, (request.item_id, current_user_id))
        existing_claim = cursor.fetchone()
        
        if existing_claim:
             raise HTTPException(status_code=400, detail="You already have an active claim on this item")
             
        # 3. Create Claim
        insert_claim = """
            INSERT INTO claims (item_id, claimer_id, finder_id, status)
            VALUES (%s, %s, %s, 'active')
        """
        cursor.execute(insert_claim, (request.item_id, current_user_id, finder_id))
        claim_id = cursor.lastrowid

        # 4. Insert initial system message
        system_msg = "[System] Claim started. Finder and claimer are now connected."
        insert_msg = """
            INSERT INTO messages (claim_id, sender_id, message_type, content)
            VALUES (%s, %s, 'system', %s)
        """
        cursor.execute(insert_msg, (claim_id, current_user_id, system_msg))

        # 5. Insert automatic greeting from System user (skip if claimer already verified)
        cursor.execute("SELECT id FROM users WHERE email = 'system@findit.internal' LIMIT 1")
        system_user = cursor.fetchone()
        if system_user:
            # New claim is never verified yet; only add greeting for new claims
            claimer_name = (current_user.get("full_name") or "there").strip() or "there"
            greeting = (
                f"Hi {claimer_name}! Before you text the finder, please click the Verify button at the top of this page "
                "to answer the security questions about this item. This helps the finder confirm you are the rightful owner!"
            )
            cursor.execute(
                "INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'system', %s)",
                (claim_id, system_user["id"], greeting)
            )

        db.commit()

        return {"success": True, "claim_id": claim_id}
        
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()

@router.get("/claims/list", response_model=List[ClaimResponse])
def list_claims(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    """
    List all claims where current user is finder OR claimer.
    """
    cursor = db.cursor(dictionary=True)
    try:
        user_id = current_user['id']
        
        # Query to fetch claims with details
        # We need to determine the "other party" name based on who the current user is.
        # This is a bit complex in SQL, so we can fetch both names and process in Python.
        query = """
            SELECT 
                c.id as claim_id, 
                c.status,
                c.updated_at,
                i.title as item_title, 
                i.image_url as item_photo,
                u_claimer.full_name as claimer_name,
                u_finder.full_name as finder_name,
                c.claimer_id,
                c.finder_id,
                (
                    SELECT content FROM messages m 
                    WHERE m.claim_id = c.id 
                    ORDER BY m.created_at DESC LIMIT 1
                ) as last_message
            FROM claims c
            JOIN items i ON c.item_id = i.id
            JOIN users u_claimer ON c.claimer_id = u_claimer.id
            JOIN users u_finder ON c.finder_id = u_finder.id
            WHERE c.claimer_id = %s OR c.finder_id = %s
            ORDER BY c.updated_at DESC
        """
        cursor.execute(query, (user_id, user_id))
        claims = cursor.fetchall()
        
        results = []
        for c in claims:
            # Determine other party
            if c['claimer_id'] == user_id:
                other_name = c['finder_name']
            else:
                other_name = c['claimer_name']
                
            results.append({
                "claim_id": c['claim_id'],
                "item_title": c['item_title'],
                "item_photo": c['item_photo'],
                "other_party_name": other_name,
                "status": c['status'],
                "last_message": c['last_message'],
                "updated_at": c['updated_at'],
                "claimer_id": c['claimer_id'],
                "finder_id": c['finder_id']
            })
            
        return results

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()


@router.post("/claims/reject")
def reject_claim(
    request: RejectClaimRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        # Check permissions - only finder can reject? 
        # Prompt says: "Only the finder -> else 403"
        cursor.execute("SELECT finder_id FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        
        if not claim:
             raise HTTPException(status_code=404, detail="Claim not found")
             
        if claim['finder_id'] != current_user['id']:
             raise HTTPException(status_code=403, detail="Only the finder can reject a claim")
             
        # Update status
        cursor.execute("UPDATE claims SET status = 'rejected' WHERE id = %s", (request.claim_id,))
        
        # Add system message
        msg = "[System] This claim has been rejected by the finder."
        cursor.execute("INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'system', %s)", 
                       (request.claim_id, current_user['id'], msg))
        
        db.commit()
        return {"success": True}
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

# ──────────────────────────────────────────────────────────
# MESSAGING
# ──────────────────────────────────────────────────────────

@router.get("/messages/thread", response_model=List[MessageResponse])
def get_message_thread(
    claim_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        user_id = current_user['id']
        
        # 1. Verify permission
        cursor.execute("SELECT claimer_id, finder_id FROM claims WHERE id = %s", (claim_id,))
        claim = cursor.fetchone()
        
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        if user_id != claim['claimer_id'] and user_id != claim['finder_id']:
            raise HTTPException(status_code=403, detail="Access denied")
            
        # 2. Fetch messages
        # Exclude handover_init content if user is claimer
        query = """
            SELECT m.id, m.sender_id, m.message_type, m.content, m.created_at, u.full_name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.claim_id = %s
            ORDER BY m.created_at ASC
        """
        cursor.execute(query, (claim_id,))
        messages = cursor.fetchall()
        
        cleaned_messages = []
        for m in messages:
            # IMPORTANT: If message_type == "handover_init" and current_user != finder_id, exclude (or mask) content
            # The prompt says "exclude that message from results" (i.e. filter it out entirely?)
            # Prompt: "If `message_type == "handover_init"` and `current_user.id != finder_id` -> **exclude that message** from results"
            
            if m['message_type'] == 'handover_init' and user_id != claim['finder_id']:
                continue
                
            cleaned_messages.append(m)
            
        return cleaned_messages

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

@router.post("/messages/send")
def send_message(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        user_id = current_user['id']
        
        # Verify claim exists and user belongs to it
        cursor.execute("SELECT status, claimer_id, finder_id FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        if user_id != claim['claimer_id'] and user_id != claim['finder_id']:
             raise HTTPException(status_code=403, detail="Access denied")
             
        if claim['status'] in ['returned', 'rejected']:
             raise HTTPException(status_code=400, detail="This conversation is closed")
             
        # Insert message
        insert_query = """
            INSERT INTO messages (claim_id, sender_id, message_type, content)
            VALUES (%s, %s, 'text', %s)
        """
        cursor.execute(insert_query, (request.claim_id, user_id, request.content))
        db.commit()
        
        return {"success": True, "message_id": cursor.lastrowid}
        
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

# ──────────────────────────────────────────────────────────
# HANDSHAKE FLOW
# ──────────────────────────────────────────────────────────

@router.post("/claims/request-identity")
def request_identity(
    request: RequestIdentityRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        # Check permission: Only Finder
        cursor.execute("SELECT finder_id FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        if not claim or claim['finder_id'] != current_user['id']:
             raise HTTPException(status_code=403, detail="Only the finder can request identity")

        # Update status
        cursor.execute("UPDATE claims SET status = 'identity_requested' WHERE id = %s", (request.claim_id,))
        
        # Add message
        msg_content = "[System] The finder has requested identity verification. Please fill in the form below."
        cursor.execute("INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'identity_form', %s)",
                       (request.claim_id, current_user['id'], msg_content))
                       
        db.commit()
        return {"success": True}
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

@router.post("/claims/submit-identity")
def submit_identity(
    request: SubmitIdentityRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    import json
    cursor = db.cursor(dictionary=True)
    try:
        # Check permission: Only Claimer
        cursor.execute("SELECT claimer_id, status FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        
        if not claim: 
            raise HTTPException(status_code=404, detail="Claim not found")
            
        if claim['claimer_id'] != current_user['id']:
             raise HTTPException(status_code=403, detail="Only the claimer can submit identity")
             
        if claim['status'] != 'identity_requested':
             raise HTTPException(status_code=400, detail="Identity verification is not currently requested")

        # Insert into IdentityVerification
        # We need check if exists first to avoid duplicate unique key error if retrying?
        # create schema said claim_id unique
        
        insert_iv = """
            INSERT INTO identity_verifications (claim_id, full_name, place_found, date_of_loss, location_of_loss, unlock_description)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), place_found=VALUES(place_found), date_of_loss=VALUES(date_of_loss), location_of_loss=VALUES(location_of_loss), unlock_description=VALUES(unlock_description)
        """
        cursor.execute(insert_iv, (
            request.claim_id, 
            request.full_name, 
            request.place_found, 
            request.date_of_loss, 
            request.location_of_loss, 
            request.unlock_description
        ))
        
        # Update Claim Status
        cursor.execute("UPDATE claims SET status = 'identity_submitted' WHERE id = %s", (request.claim_id,))

        # Create Response Message content (JSON string)
        response_data = {
            "full_name": request.full_name,
            "place_found": request.place_found,
            "date_of_loss": str(request.date_of_loss) if request.date_of_loss else None,
            "location_of_loss": request.location_of_loss,
            "unlock_description": request.unlock_description
        }
        
        cursor.execute("INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'identity_response', %s)",
                       (request.claim_id, current_user['id'], json.dumps(response_data)))
        
        db.commit()
        return {"success": True}
        
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

@router.post("/claims/initiate-handover")
def initiate_handover(
    request: InitiateHandoverRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        # Check permission: Only Finder
        cursor.execute("SELECT finder_id, status FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        
        if not claim or claim['finder_id'] != current_user['id']:
             raise HTTPException(status_code=403, detail="Only the finder can initiate handover")
             
        if claim['status'] != 'identity_submitted' and claim['status'] != 'active': 
             # allowing from active too if they skipped identity? prompt says "Claim status must be `identity_submitted` -> else `400`"
             if claim['status'] != 'identity_submitted':
                  raise HTTPException(status_code=400, detail="Identity must be submitted first")
        
        # Generate Code
        code = f"#{random.randint(1000, 9999)}"
        
        # Update Claim
        cursor.execute("UPDATE claims SET handover_code = %s, status = 'handover_initiated' WHERE id = %s", 
                       (code, request.claim_id))
                       
        # Insert Message
        msg = f"[System] Hand-over initiated. Code: {code}"
        cursor.execute("INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'handover_init', %s)",
                       (request.claim_id, current_user['id'], msg))
                       
        db.commit()
        return {"success": True, "handover_code": code}
        
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()

@router.post("/claims/confirm-handover")
def confirm_handover(
    request: ConfirmHandoverRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db_connection)
):
    cursor = db.cursor(dictionary=True)
    try:
        # Permission: Only Claimer
        cursor.execute("SELECT claimer_id, status, handover_code, item_id FROM claims WHERE id = %s", (request.claim_id,))
        claim = cursor.fetchone()
        
        if not claim: 
             raise HTTPException(status_code=404, detail="Claim not found")
             
        if claim['claimer_id'] != current_user['id']:
             raise HTTPException(status_code=403, detail="Only the claimer can confirm handover")
             
        if claim['status'] != 'handover_initiated':
             raise HTTPException(status_code=400, detail="Handover not initiated")
             
        if request.code != claim['handover_code']:
             raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")
             
        # Success!
        # Update Claim Status -> returned
        cursor.execute("UPDATE claims SET status = 'returned' WHERE id = %s", (request.claim_id,))
        
        # Update Item Status -> returned
        cursor.execute("UPDATE items SET status = 'Recovered' WHERE id = %s", (claim['item_id'],)) 
        # Note: prompt says 'returned' but item status enum in db is 'Recovered' (or 'returned'? prompt requested 'returned').
        # Schema.sql says ENUM('Lost', 'Found', 'Recovered')
        # Prompt says "Update `item.status = "returned"` in the items table".
        # If I use "returned", it might fail enum check if strictly enforced by MySQL unless I updated ENUM.
        # My init_db says ENUM('Lost', 'Found', 'Recovered').
        # So I should use 'Recovered' to be safe, or I should have updated the ENUM in schema update.
        # I did not update Items table enum in schema update. So I MUST use 'Recovered'.
        
        # Message
        msg = "[System] Verification Successful! The item has been returned. 🎉"
        cursor.execute("INSERT INTO messages (claim_id, sender_id, message_type, content) VALUES (%s, %s, 'handover_confirm', %s)",
                       (request.claim_id, current_user['id'], msg))
                       
        db.commit()
        return {"success": True}
        
    except mysql.connector.Error as err:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
