from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List, Optional
import urllib.parse

from app.config.settings import GENERATED_DIR
from app.config.events import resolve_canonical_event_name
from app.models.schemas import GenerateRequest, GenerateResponse, Participant, SelectEventRequest
from app.services.certificate_service import (
    generate_participant_pdf,
    generate_participant_preview_image,
    create_zip_archive
)
from app.services.session_store import get_session, get_participant, create_or_update_session

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

@router.post("/select-event")
def select_event(payload: SelectEventRequest):
    """
    Explicitly updates the active symposium event for an existing session.
    Invalidates any stale certificate PDFs or ZIP archives generated for a previous event.
    """
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    try:
        new_event = resolve_canonical_event_name(payload.event_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    previous_event = session.get("event_name")
    session["event_name"] = new_event

    # If event changed, clear previous generation cache so it never serves stale certificates
    if previous_event != new_event:
        session["zip_path"] = None
        session["zip_event"] = None
        session["generated_pdfs"] = {}

        participants = session.get("participants", {})
        for p in participants.values():
            if getattr(p, "certificate_event", None) != new_event:
                p.certificate_path = None
                p.certificate_event = None
                if p.status in ("generated", "sent"):
                    p.status = "ready"

    return {"status": "ok", "event_name": new_event}

@router.post("/generate", response_model=GenerateResponse)
def generate_certificates(payload: GenerateRequest):
    """
    Generate individual high-quality PDF certificates for participants in the session.
    Bundles all outputs into a downloadable ZIP archive using the explicit selected event.
    """
    session = get_session(payload.session_id)
    if not session or "participants" not in session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    raw_event = payload.event_name or session.get("event_name")
    if not raw_event:
        raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

    try:
        event_name = resolve_canonical_event_name(raw_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    participants_dict = session["participants"]
    session["event_name"] = event_name

    # Session directory for storing generated certificates
    session_dir = GENERATED_DIR / payload.session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # Determine which participants to generate for
    target_ids = payload.participant_ids or [
        pid for pid, p in participants_dict.items() if p.status in ("ready", "generated")
    ]

    if not target_ids:
        raise HTTPException(status_code=400, detail="No eligible participants available for certificate generation")

    generated_pdf_paths: List[str] = []
    updated_participants: List[Participant] = []

    for pid in target_ids:
        p: Participant = participants_dict.get(pid)
        if not p:
            continue

        try:
            pdf_path = generate_participant_pdf(
                participant=p,
                event_name=event_name,
                output_dir=session_dir,
                overlay_event_details=payload.overlay_event_details
            )
            p.status = "generated"
            p.certificate_path = pdf_path
            p.certificate_event = event_name
            generated_pdf_paths.append(pdf_path)
            session["generated_pdfs"][pid] = pdf_path
        except Exception as e:
            p.status = "failed"
            p.error_detail = f"PDF generation error: {str(e)}"

        updated_participants.append(p)

    # Create ZIP archive
    zip_path = None
    zip_url = None
    if generated_pdf_paths:
        zip_path = create_zip_archive(generated_pdf_paths, event_name, payload.session_id)
        session["zip_path"] = zip_path
        session["zip_event"] = event_name
        zip_url = f"/api/certificates/download-zip/{payload.session_id}?event_name={urllib.parse.quote(event_name)}"

    create_or_update_session(payload.session_id, {
        "participants": participants_dict,
        "zip_path": zip_path,
        "zip_event": event_name,
        "event_name": event_name
    })

    return GenerateResponse(
        session_id=payload.session_id,
        total_generated=len(generated_pdf_paths),
        zip_download_url=zip_url,
        participants=list(participants_dict.values())
    )

@router.get("/preview/{session_id}/{participant_id}")
def preview_certificate_image(
    session_id: str,
    participant_id: str,
    overlay_event: bool = Query(False),
    event_name: Optional[str] = Query(None)
):
    """
    Renders an instant, high-resolution visual preview image of the certificate.
    Uses explicitly requested event_name if provided.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    p = get_participant(session_id, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    raw_event = event_name or session.get("event_name")
    if not raw_event:
        raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

    try:
        target_event = resolve_canonical_event_name(raw_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session["event_name"] = target_event

    try:
        img_bytes = generate_participant_preview_image(
            participant=p,
            event_name=target_event,
            overlay_event_details=overlay_event
        )
        return Response(content=img_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {str(e)}")

@router.get("/preview-pdf/{session_id}/{participant_id}")
def preview_certificate_pdf(
    session_id: str,
    participant_id: str,
    overlay_event: bool = Query(False),
    event_name: Optional[str] = Query(None)
):
    """
    Stream or return the PDF file for in-browser viewer embedding and download.
    Guarantees the PDF matches the explicitly requested event_name.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    p = get_participant(session_id, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    raw_event = event_name or session.get("event_name")
    if not raw_event:
        raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

    try:
        target_event = resolve_canonical_event_name(raw_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session["event_name"] = target_event

    # If already generated on disk for THIS exact event, return existing file
    if (
        p.certificate_path and
        Path(p.certificate_path).exists() and
        getattr(p, "certificate_event", None) == target_event
    ):
        return FileResponse(
            path=p.certificate_path,
            media_type="application/pdf",
            filename=p.certificate_filename or f"{p.name.replace(' ', '_')}_Techbyte_Summit_26.pdf"
        )

    # Otherwise generate for the requested event
    session_dir = GENERATED_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = generate_participant_pdf(
        participant=p,
        event_name=target_event,
        output_dir=session_dir,
        overlay_event_details=overlay_event
    )
    p.certificate_path = pdf_path
    p.certificate_event = target_event
    session["generated_pdfs"][participant_id] = pdf_path

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=p.certificate_filename or f"{p.name.replace(' ', '_')}_Techbyte_Summit_26.pdf"
    )

@router.get("/download-zip/{session_id}")
def download_certificates_zip(
    session_id: str,
    event_name: Optional[str] = Query(None)
):
    """
    Download the bundled ZIP archive of all generated certificates.
    Ensures the archive corresponds to the specified event.
    """
    session = get_session(session_id)
    if not session or "participants" not in session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    raw_event = event_name or session.get("event_name")
    if not raw_event:
        raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

    try:
        target_event = resolve_canonical_event_name(raw_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # If valid ZIP exists for this exact event, serve it
    if (
        session.get("zip_path") and
        session.get("zip_event") == target_event and
        Path(session["zip_path"]).exists()
    ):
        zip_file = Path(session["zip_path"])
        return FileResponse(
            path=str(zip_file),
            media_type="application/zip",
            filename=zip_file.name
        )

    # Otherwise generate/regenerate PDFs and archive for target_event
    session_dir = GENERATED_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    pdf_paths: List[str] = []
    for pid, p in session["participants"].items():
        if p.status != "invalid":
            pdf_path = generate_participant_pdf(p, target_event, session_dir)
            p.certificate_path = pdf_path
            p.certificate_event = target_event
            p.status = "generated"
            pdf_paths.append(pdf_path)

    if not pdf_paths:
        raise HTTPException(status_code=400, detail="No certificates available to bundle")

    zip_path = create_zip_archive(pdf_paths, target_event, session_id)
    session["zip_path"] = zip_path
    session["zip_event"] = target_event
    session["event_name"] = target_event

    zip_file = Path(zip_path)
    return FileResponse(
        path=str(zip_file),
        media_type="application/zip",
        filename=zip_file.name
    )

@router.get("/download/{session_id}/{participant_id}")
def download_single_pdf(
    session_id: str,
    participant_id: str,
    event_name: Optional[str] = Query(None)
):
    """
    Download an individual participant's PDF certificate.
    Guarantees the downloaded certificate corresponds to the selected event.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    p = get_participant(session_id, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    raw_event = event_name or session.get("event_name")
    if not raw_event:
        raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

    try:
        target_event = resolve_canonical_event_name(raw_event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if (
        p.certificate_path and
        Path(p.certificate_path).exists() and
        getattr(p, "certificate_event", None) == target_event
    ):
        pdf_path = p.certificate_path
    else:
        # Generate on-the-fly for the requested event
        session_dir = GENERATED_DIR / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = generate_participant_pdf(p, target_event, session_dir)
        p.certificate_path = pdf_path
        p.certificate_event = target_event

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=p.certificate_filename or f"{p.name.replace(' ', '_')}_Techbyte_Summit_26.pdf"
    )


