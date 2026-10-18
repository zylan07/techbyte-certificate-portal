import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import StreamingResponse
import io

from app.config.settings import MAX_UPLOAD_SIZE_BYTES
from app.config.events import resolve_canonical_event_name
from app.models.schemas import ValidationSummary, Participant
from app.services.excel_service import (
    parse_and_validate_file,
    generate_sample_excel_template,
    generate_validation_error_report
)
from app.services.session_store import create_or_update_session, get_session

router = APIRouter(prefix="/api/upload", tags=["Upload"])

@router.post("/excel", response_model=ValidationSummary)
async def upload_excel(
    file: UploadFile = File(...),
    event_name: str = Form(...)
):
    """
    Accepts .xlsx, .xls, or .csv participant spreadsheet.
    Validates columns, names, colleges, email formats, and duplicates.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        canonical_event = resolve_canonical_event_name(event_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Read content
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty. Please provide a spreadsheet with data.")

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size ({MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB)"
        )

    try:
        summary = parse_and_validate_file(contents, file.filename, canonical_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error processing spreadsheet: {str(e)}")

    # Store in session
    create_or_update_session(summary.session_id, {
        "event_name": canonical_event,
        "validation_summary": summary,
        "participants": {p.id: p for p in summary.participants},
        "errors": summary.errors,
        "generated_pdfs": {}
    })

    return summary

@router.get("/template")
def download_template(event_name: str | None = None):
    """Download official TechByte Summit '26 Excel participant template."""
    file_bytes = generate_sample_excel_template(event_name)
    if event_name and "recognition" in event_name.lower():
        filename = "Techbyte_Summit_26_Recognition_Template.xlsx"
    else:
        filename = "Techbyte_Summit_26_Participant_Template.xlsx"
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/error-report/{session_id}")
def download_error_report(session_id: str):
    """Download validation error report spreadsheet for a given session."""
    session = get_session(session_id)
    if not session or "errors" not in session:
        raise HTTPException(status_code=404, detail="Session or error log not found")

    errors = session["errors"]
    if not errors:
        raise HTTPException(status_code=400, detail="No validation errors in this session")

    file_bytes = generate_validation_error_report(errors)
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="Validation_Errors_{session_id[:8]}.xlsx"'
        }
    )


from pydantic import BaseModel, Field
from app.utils.validator import is_valid_email
from app.utils.sanitizer import sanitize_text, sanitize_pdf_filename

class SingleRecipientRequest(BaseModel):
    name: str = Field(..., description="Recipient full name")
    mail_id: str = Field(..., description="Recipient email address for certificate delivery")
    event_name: str = Field(..., description="Symposium event or Certificate type")
    class_section: str | None = Field(None, description="Class / Section for Certificate of Recognition")
    college_name: str | None = None

@router.post("/single", response_model=ValidationSummary)
def add_single_recipient(payload: SingleRecipientRequest):
    """
    Directly register a single participant/recipient (e.g., for Certificate of Recognition)
    without requiring an Excel file upload, enabling instant preview and generation.
    """
    try:
        canonical_event = resolve_canonical_event_name(payload.event_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    name = sanitize_text(payload.name)
    raw_class = (payload.class_section or "").strip()
    class_section = sanitize_text(raw_class)
    raw_email = payload.mail_id.strip()
    email = sanitize_text(raw_email).lower()
    is_rec = "recognition" in canonical_event.lower()

    college = sanitize_text(payload.college_name or "")
    if is_rec and not college:
        college = "KPR Institute of Engineering and Technology, Coimbatore"

    errors = []
    row_errors = []
    if not name:
        row_errors.append("Participant Name cannot be empty")
    if is_rec:
        if not class_section:
            row_errors.append("Class / Section cannot be empty")
    else:
        if not college:
            row_errors.append("College Name cannot be empty")
    if not email:
        row_errors.append("Mail ID cannot be empty")
    elif not is_valid_email(email):
        row_errors.append(f"Invalid email format: '{raw_email}'")

    session_id = str(uuid.uuid4())
    p_id = f"{session_id}_1"
    cert_filename = sanitize_pdf_filename(name) if name else "Certificate_Techbyte_Summit_26.pdf"

    if row_errors:
        status = "invalid"
        error_detail = "; ".join(row_errors)
        errors.append({
            "row": 1,
            "name": name or "(empty)",
            "college": college or "(empty)",
            "email": raw_email or "(empty)",
            "error": error_detail,
            "type": "error"
        })
        valid_cnt = 0
        invalid_cnt = 1
    else:
        status = "ready"
        error_detail = None
        valid_cnt = 1
        invalid_cnt = 0

    participant = Participant(
        id=p_id,
        row_num=1,
        name=name,
        class_section=class_section if is_rec else None,
        college_name=college,
        mail_id=email,
        status=status,
        error_detail=error_detail,
        certificate_filename=cert_filename,
        certificate_path=None
    )

    summary = ValidationSummary(
        session_id=session_id,
        total_records=1,
        valid_records=valid_cnt,
        invalid_records=invalid_cnt,
        duplicate_records=0,
        participants=[participant],
        errors=errors
    )

    create_or_update_session(session_id, {
        "event_name": canonical_event,
        "validation_summary": summary,
        "participants": {participant.id: participant},
        "errors": summary.errors,
        "generated_pdfs": {}
    })

    return summary
