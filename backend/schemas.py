from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class StartClaimRequest(BaseModel):
    item_id: int

class SendMessageRequest(BaseModel):
    claim_id: int
    content: str

class RequestIdentityRequest(BaseModel):
    claim_id: int

class SubmitIdentityRequest(BaseModel):
    claim_id: int
    full_name: str
    place_found: Optional[str] = None
    date_of_loss: Optional[date] = None
    location_of_loss: Optional[str] = None
    unlock_description: Optional[str] = None

class InitiateHandoverRequest(BaseModel):
    claim_id: int

class ConfirmHandoverRequest(BaseModel):
    claim_id: int
    code: str

class RejectClaimRequest(BaseModel):
    claim_id: int

class ClaimResponse(BaseModel):
    claim_id: int
    item_title: str
    item_photo: Optional[str] = None
    other_party_name: str
    status: str
    last_message: Optional[str] = None
    updated_at: Optional[datetime] = None
    claimer_id: int
    finder_id: int

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str] = None
    message_type: str
    content: str
    created_at: datetime
