from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pathlib import Path

from app.models.schemas import SendEmailRequest, DeliveryReport, DeliveryReportItem, Participant
from app.config.events import resolve_canonical_event_name
from app.services.email_service import (
    send_individual_email,
    is_smtp_configured,
    get_email_status_dict,
    test_smtp_connection,
    validate_recipient_email
)
from app.services.certificate_service import generate_participant_pdf
from app.services.session_store import get_session, get_participant, create_or_update_session
from app.config.settings import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_FROM_NAME,
    SMTP_FROM_EMAIL,
    GENERATED_DIR
)

router = APIRouter(prefix="/api/email", tags=["Email"])

@router.get("/config-status")
def get_email_config_status():
    """
    Returns public non-secret SMTP status for organizer visibility.
    Never exposes passwords or sensitive keys.
    """
    return get_email_status_dict()

@router.post("/test")
def test_email_configuration():
    """
    Tests SMTP connection and authentication without sending emails to participants.
    Returns safe success or error message. Never exposes password.
    """
    success, message = test_smtp_connection()
    return {
        "success": success,
        "message": message,
        "status": get_email_status_dict()
    }

@router.post("/send-test")
def send_single_test_email(recipient_email: Optional[str] = None):
    """
    Sends exactly ONE controlled test email to the configured sender account (or specified test email)
    with a sample Hackathon certificate to verify live delivery end-to-end safely.
    Never exposes passwords.
    """
    target_email = recipient_email or SMTP_FROM_EMAIL
    test_session_dir = GENERATED_DIR / "test_email_dispatch"
    test_session_dir.mkdir(parents=True, exist_ok=True)

    test_participant = Participant(
        id="test_admin_recipient",
        row_num=1,
        name="Techbyte Admin",
        college_name="KPR Institute of Engineering and Technology",
        mail_id=target_email,
        status="ready"
    )

    pdf_path = generate_participant_pdf(
        participant=test_participant,
        event_name="Hackathon",
        output_dir=test_session_dir
    )

    success, message = send_individual_email(
        participant=test_participant,
        event_name="Hackathon",
        pdf_path=pdf_path,
        dry_run=False
    )

    return {
        "success": success,
        "recipient": target_email,
        "event": "Hackathon",
        "attachment": Path(pdf_path).name,
        "message": message
    }

@router.post("/send", response_model=DeliveryReport)
def send_certificates(payload: SendEmailRequest):
    """
    Dispatches personalized participation certificates to each participant's email.
    Attaches strictly the participant's own PDF generated for the selected event.
    Guarded against double-submission.
    """
    session = get_session(payload.session_id)
    if not session or "participants" not in session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # Double-submission guard
    if session.get("is_sending", False):
        raise HTTPException(status_code=409, detail="Email dispatch is already currently running for this session.")

    session["is_sending"] = True
    try:
        raw_event = payload.event_name or session.get("event_name")
        if not raw_event:
            raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

        try:
            event_name = resolve_canonical_event_name(raw_event)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        participants_dict = session["participants"]
        previous_event = session.get("event_name")
        if previous_event != event_name:
            for p in participants_dict.values():
                if getattr(p, "certificate_event", None) != event_name:
                    p.certificate_path = None
                    p.certificate_event = None
                    if p.status in ("generated", "sent"):
                        p.status = "ready"

        session["event_name"] = event_name

        # Target participants (exclude invalid and duplicate rows)
        if payload.participant_ids:
            target_ids = payload.participant_ids
        elif payload.dry_run:
            target_ids = [
                pid for pid, p in participants_dict.items() if p.status in ("ready", "generated", "sent", "failed")
            ]
        else:
            target_ids = [
                pid for pid, p in participants_dict.items() if p.status in ("ready", "generated", "failed")
            ]

        if not target_ids:
            raise HTTPException(status_code=400, detail="No eligible participants available for email delivery")

        session_dir = GENERATED_DIR / payload.session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        report_items: List[DeliveryReportItem] = []
        sent_count = 0
        failed_count = 0

        for pid in target_ids:
            p: Participant = participants_dict.get(pid)
            if not p:
                continue

            # 1. Validate recipient email address format before sending
            is_valid_email, email_err = validate_recipient_email(p.mail_id)
            if not is_valid_email:
                p.status = "failed"
                p.error_detail = email_err
                failed_count += 1
                report_items.append(DeliveryReportItem(
                    id=p.id,
                    name=p.name,
                    email=p.mail_id,
                    certificate=p.certificate_filename or "N/A",
                    status="FAILED",
                    error=email_err
                ))
                continue

            # 2. Ensure PDF exists on disk and matches current selected event, otherwise generate it
            pdf_path = p.certificate_path
            needs_gen = (
                not pdf_path or
                not Path(pdf_path).exists() or
                getattr(p, "certificate_event", None) != event_name
            )

            if needs_gen:
                try:
                    pdf_path = generate_participant_pdf(
                        participant=p,
                        event_name=event_name,
                        output_dir=session_dir
                    )
                    p.certificate_path = pdf_path
                    p.certificate_event = event_name
                    session["generated_pdfs"][pid] = pdf_path
                except Exception as e:
                    p.status = "failed"
                    p.error_detail = f"PDF generation error before send: {str(e)}"
                    failed_count += 1
                    report_items.append(DeliveryReportItem(
                        id=p.id,
                        name=p.name,
                        email=p.mail_id,
                        certificate=p.certificate_filename or "N/A",
                        status="FAILED",
                        error=p.error_detail
                    ))
                    continue

            # 3. Send email to participant
            success, message = send_individual_email(
                participant=p,
                event_name=event_name,
                pdf_path=pdf_path,
                dry_run=payload.dry_run
            )

            if success:
                p.status = "sent"
                p.error_detail = None
                sent_count += 1
                report_items.append(DeliveryReportItem(
                    id=p.id,
                    name=p.name,
                    email=p.mail_id,
                    certificate=p.certificate_filename or Path(pdf_path).name,
                    status="SENT",
                    error=None
                ))
            else:
                p.status = "failed"
                p.error_detail = message
                failed_count += 1
                report_items.append(DeliveryReportItem(
                    id=p.id,
                    name=p.name,
                    email=p.mail_id,
                    certificate=p.certificate_filename or Path(pdf_path).name,
                    status="FAILED",
                    error=message
                ))

        delivery_report = DeliveryReport(
            session_id=payload.session_id,
            total_participants=len(participants_dict),
            certificates_generated=len([p for p in participants_dict.values() if p.certificate_path]),
            emails_sent=sent_count,
            failed=failed_count,
            items=report_items
        )

        create_or_update_session(payload.session_id, {
            "participants": participants_dict,
            "delivery_report": delivery_report
        })

        return delivery_report

    finally:
        session["is_sending"] = False

@router.post("/retry", response_model=DeliveryReport)
def retry_failed_emails(payload: SendEmailRequest):
    """
    Retries sending only to participants whose status is FAILED.
    Strictly avoids re-sending to participants whose emails were already successfully sent.
    Guarded against double-submission.
    """
    session = get_session(payload.session_id)
    if not session or "participants" not in session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    if session.get("is_retrying", False):
        raise HTTPException(status_code=409, detail="Email retry dispatch is already in progress.")

    session["is_retrying"] = True
    try:
        raw_event = payload.event_name or session.get("event_name")
        if not raw_event:
            raise HTTPException(status_code=400, detail="Event name is required. Please select an event.")

        try:
            event_name = resolve_canonical_event_name(raw_event)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        session["event_name"] = event_name
        participants_dict = session["participants"]

        failed_participants = [p for p in participants_dict.values() if p.status == "failed"]
        if not failed_participants:
            raise HTTPException(status_code=400, detail="No failed certificates to retry.")

        session_dir = GENERATED_DIR / payload.session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        for p in failed_participants:
            pdf_path = p.certificate_path
            needs_gen = (
                not pdf_path or
                not Path(pdf_path).exists() or
                getattr(p, "certificate_event", None) != event_name
            )
            if needs_gen:
                try:
                    pdf_path = generate_participant_pdf(
                        participant=p,
                        event_name=event_name,
                        output_dir=session_dir
                    )
                    p.certificate_path = pdf_path
                    p.certificate_event = event_name
                except Exception as e:
                    p.status = "failed"
                    p.error_detail = f"PDF generation error before retry: {str(e)}"
                    continue

            success, message = send_individual_email(
                participant=p,
                event_name=event_name,
                pdf_path=pdf_path,
                dry_run=payload.dry_run
            )

            if success:
                p.status = "sent"

                p.error_detail = None
            else:
                p.status = "failed"
                p.error_detail = message
    finally:
        session["is_retrying"] = False

    # Reconstruct comprehensive delivery report
    all_report_items: List[DeliveryReportItem] = []
    sent_count = 0
    failed_count = 0

    for p in participants_dict.values():
        if p.status in ("sent", "failed"):
            status_str = "SENT" if p.status == "sent" else "FAILED"
            if status_str == "SENT":
                sent_count += 1
            else:
                failed_count += 1

            all_report_items.append(DeliveryReportItem(
                id=p.id,
                name=p.name,
                email=p.mail_id,
                certificate=p.certificate_filename or "Techbyte_Certificate.pdf",
                status=status_str,
                error=p.error_detail
            ))

    delivery_report = DeliveryReport(
        session_id=payload.session_id,
        total_participants=len(participants_dict),
        certificates_generated=len([p for p in participants_dict.values() if p.certificate_path]),
        emails_sent=sent_count,
        failed=failed_count,
        items=all_report_items
    )

    create_or_update_session(payload.session_id, {
        "participants": participants_dict,
        "delivery_report": delivery_report
    })

    return delivery_report

@router.get("/report/{session_id}", response_model=DeliveryReport)
def get_delivery_report(session_id: str):
    """Retrieve delivery report for the current session."""
    session = get_session(session_id)
    if not session or "delivery_report" not in session:
        raise HTTPException(status_code=404, detail="Delivery report not found for this session")

    return session["delivery_report"]
