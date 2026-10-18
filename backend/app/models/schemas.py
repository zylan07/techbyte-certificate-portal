from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Participant(BaseModel):
    id: str
    row_num: int
    name: str
    college_name: str
    class_section: Optional[str] = None
    mail_id: str
    status: str = "ready"  # ready, invalid, duplicate, generated, sent, failed
    error_detail: Optional[str] = None
    certificate_filename: Optional[str] = None
    certificate_path: Optional[str] = None
    certificate_event: Optional[str] = None

class SelectEventRequest(BaseModel):
    session_id: str
    event_name: str

class ValidationSummary(BaseModel):
    session_id: str
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    participants: List[Participant]
    errors: List[Dict[str, Any]]

class EventInfo(BaseModel):
    id: str
    name: str
    template: str
    date: str
    department: str
    institution: str
    description: str

class GenerateRequest(BaseModel):
    session_id: str
    event_name: str
    participant_ids: Optional[List[str]] = None
    overlay_event_details: bool = False

class GenerateResponse(BaseModel):
    session_id: str
    total_generated: int
    zip_download_url: Optional[str] = None
    participants: List[Participant]

class SendEmailRequest(BaseModel):
    session_id: str
    event_name: str
    participant_ids: Optional[List[str]] = None
    dry_run: Optional[bool] = None

class DeliveryReportItem(BaseModel):
    id: str
    name: str
    email: str
    certificate: str
    status: str  # "SENT" or "FAILED"
    error: Optional[str] = None

class DeliveryReport(BaseModel):
    session_id: str
    total_participants: int
    certificates_generated: int
    emails_sent: int
    failed: int
    items: List[DeliveryReportItem]
