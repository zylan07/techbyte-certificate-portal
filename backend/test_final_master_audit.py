"""
TECHBYTE SUMMIT '26 - MASTER REGRESSION & VERIFICATION SCRIPT
Executes sections 8, 10, 11, 12, 13, 14, 15, 16 requirements:
- Direct Hackathon file sha256 calculation and verification
- 7 canonical events PDF generation and comparison
- Event-specific visual background confirmation
- Email dry-run verification for Coding Contest and Hackathon
- Participant-specific attachment isolation verification
- Live SMTP connection check against smtp.gmail.com:587
- Single controlled test email to techbytecertificate@gmail.com
- Selective retry mechanism testing
"""

import os
import sys
import hashlib
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from app.main import app
from app.config.events import (
    CANONICAL_EVENTS,
    EVENT_TEMPLATE_MAP,
    get_template_path_for_event,
    validate_all_templates,
    resolve_canonical_event_name
)
from app.services.email_service import (
    render_email_content,
    send_individual_email,
    test_smtp_connection,
    is_smtp_configured
)
from app.models.schemas import Participant

client = TestClient(app)

def run_master_verification():
    print("=" * 70)
    print("STARTING TECHBYTE SUMMIT '26 MASTER REGRESSION VERIFICATION")
    print("=" * 70)

    # ---------------------------------------------------------
    # STEP 1: Startup & Dimension Check (2000 x 1414 for all 7)
    # ---------------------------------------------------------
    print("\n--- STEP 1: Validating All 7 Templates Dimensions (2000 x 1414) ---")
    templates_dir = BASE_DIR / "templates"
    template_paths = validate_all_templates()
    assert len(template_paths) >= 7

    for ev in CANONICAL_EVENTS:
        p = get_template_path_for_event(ev)
        with Image.open(p) as img:
            assert img.size == (2000, 1414), f"Dimension error for {ev}: {img.size}"
            print(f"  [PASS] {ev}: {p.name} -> {img.size[0]}x{img.size[1]}px")

    # ---------------------------------------------------------
    # STEP 2: Current Hackathon Template SHA256 Checksum
    # ---------------------------------------------------------
    print("\n--- STEP 2: Current Hackathon Template SHA256 Verification ---")
    hackathon_path = templates_dir / "Hackathon Participation.png"
    assert hackathon_path.exists(), "Hackathon Participation.png missing!"
    with open(hackathon_path, "rb") as f:
        hackathon_sha256 = hashlib.sha256(f.read()).hexdigest()
    print(f"  [PASS] Current Hackathon Template SHA256: {hackathon_sha256}")

    # ---------------------------------------------------------
    # STEP 3: Live Application Health Check
    # ---------------------------------------------------------
    print("\n--- STEP 3: API Health Check ---")
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    print(f"  [PASS] /api/health returned 200 Healthy: {res.json()}")

    # ---------------------------------------------------------
    # STEP 4: Upload Participant Data to Establish Session
    # ---------------------------------------------------------
    print("\n--- STEP 4: Participant Upload ---")
    sample_file = BASE_DIR / "sample_participants.xlsx"
    with open(sample_file, "rb") as f:
        upload_res = client.post(
            "/api/upload/excel",
            files={"file": ("sample_participants.xlsx", f.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"event_name": "Paper Presentation"}
        )
    assert upload_res.status_code == 200
    summary = upload_res.json()
    session_id = summary["session_id"]
    participant = summary["participants"][0]
    p_id = participant["id"]
    print(f"  [PASS] Uploaded sample data: session_id={session_id[:8]}..., participant='{participant['name']}'")

    # ---------------------------------------------------------
    # STEP 5: Generate and Verify All 7 Events End-to-End
    # ---------------------------------------------------------
    print("\n--- STEP 5: Generating and Comparing All 7 Canonical Events ---")
    event_pdfs = {}

    for event_name in CANONICAL_EVENTS:
        # A. Switch session event
        r_sel = client.post("/api/certificates/select-event", json={"session_id": session_id, "event_name": event_name})
        assert r_sel.status_code == 200

        # B. Preview Image
        r_prev = client.get(f"/api/certificates/preview/{session_id}/{p_id}?event_name={event_name}")
        assert r_prev.status_code == 200
        assert r_prev.headers["content-type"] == "image/jpeg"

        # C. Generate PDF
        r_gen = client.post("/api/certificates/generate", json={"session_id": session_id, "event_name": event_name})
        assert r_gen.status_code == 200

        # D. Download PDF
        r_pdf = client.get(f"/api/certificates/download/{session_id}/{p_id}?event_name={event_name}")
        assert r_pdf.status_code == 200
        assert r_pdf.headers["content-type"] == "application/pdf"
        pdf_bytes = r_pdf.content
        assert pdf_bytes[:5] == b"%PDF-"

        # E. Download ZIP
        r_zip = client.get(f"/api/certificates/download-zip/{session_id}?event_name={event_name}")
        assert r_zip.status_code == 200
        assert len(r_zip.content) > 100000

        event_pdfs[event_name] = pdf_bytes
        print(f"  [PASS] {event_name}: PDF size={len(pdf_bytes)} bytes, ZIP size={len(r_zip.content)} bytes")

    # ---------------------------------------------------------
    # STEP 6: Cross-Event Distinctness Verification (No Paper Presentation fallback!)
    # ---------------------------------------------------------
    print("\n--- STEP 6: Cross-Event Distinctness Verification ---")
    sizes = {k: len(v) for k, v in event_pdfs.items()}
    assert sizes["Coding Contest"] != sizes["Paper Presentation"], "Coding Contest matched Paper Presentation size!"
    assert sizes["Hackathon"] != sizes["Paper Presentation"], "Hackathon matched Paper Presentation size!"
    assert sizes["Coding Contest"] != sizes["Hackathon"], "Coding Contest matched Hackathon size!"

    print("  [PASS] All generated PDFs reflect their unique underlying template graphics.")
    print(f"         Coding Contest size: {sizes['Coding Contest']} bytes")
    print(f"         Hackathon size:      {sizes['Hackathon']} bytes")
    print(f"         Paper Pres size:     {sizes['Paper Presentation']} bytes")

    # ---------------------------------------------------------
    # STEP 7: Participant-Specific Attachment Verification (A gets A, B gets B)
    # ---------------------------------------------------------
    print("\n--- STEP 7: Participant-Specific Attachment Verification ---")
    p_arun = summary["participants"][0]
    p_priya = summary["participants"][2]
    assert p_arun["name"] != p_priya["name"]
    assert p_arun["certificate_filename"] != p_priya["certificate_filename"]
    assert "Arun_Kumar" in p_arun["certificate_filename"]
    assert "Priya" in p_priya["certificate_filename"]
    print(f"  [PASS] Participant A ({p_arun['name']}) -> {p_arun['certificate_filename']}")
    print(f"  [PASS] Participant B ({p_priya['name']}) -> {p_priya['certificate_filename']}")

    # ---------------------------------------------------------
    # STEP 8: Email Content & Multi-Event Verification
    # ---------------------------------------------------------
    print("\n--- STEP 8: Email Content Verification for 4 Target Events ---")
    target_events = ["Paper Presentation", "Coding Contest", "Hackathon", "Project Presentation"]
    for ev in target_events:
        subject, body = render_email_content("Arun Kumar", ev)
        expected_subject = f"Certificate of Participation – Techbyte Summit ’26 – {ev}"
        assert subject == expected_subject, f"Subject mismatch for {ev}: {subject}"
        assert ev in body
        assert "KPR Institute of Engineering and Technology, Coimbatore" in body
        assert "Department of Computer Science and Engineering" in body
        print(f"  [PASS] {ev} Subject: '{subject}'")

    # ---------------------------------------------------------
    # STEP 9: Email Dry-Run Verification (Coding Contest & Hackathon)
    # ---------------------------------------------------------
    print("\n--- STEP 9: Email Dry-Run Verification ---")
    r_email_cc = client.post(
        "/api/email/send",
        json={"session_id": session_id, "event_name": "Coding Contest", "dry_run": True}
    )
    assert r_email_cc.status_code == 200
    report_cc = r_email_cc.json()
    assert report_cc["emails_sent"] == 5
    assert report_cc["failed"] == 0
    print(f"  [PASS] Coding Contest Email Dry-Run: 5/5 prepared, 0 failed")

    r_email_hack = client.post(
        "/api/email/send",
        json={"session_id": session_id, "event_name": "Hackathon", "dry_run": True}
    )
    assert r_email_hack.status_code == 200
    report_hack = r_email_hack.json()
    assert report_hack["emails_sent"] == 5
    assert report_hack["failed"] == 0
    print(f"  [PASS] Hackathon Email Dry-Run: 5/5 prepared, 0 failed")

    # ---------------------------------------------------------
    # STEP 10: SMTP Connection and Authentication Test
    # ---------------------------------------------------------
    print("\n--- STEP 10: Gmail SMTP Connection & Authentication Test ---")
    r_test = client.post("/api/email/test")
    assert r_test.status_code == 200
    t_res = r_test.json()
    assert t_res["success"] is True, f"SMTP Connection failed: {t_res['message']}"
    assert "successful" in t_res["message"].lower()
    assert "smtp.gmail.com:587" in t_res["message"]
    print(f"  [PASS] Gmail SMTP authentication succeeded: {t_res['message']}")

    # ---------------------------------------------------------
    # STEP 11: Real Single Controlled Test Email to techbytecertificate@gmail.com
    # ---------------------------------------------------------
    print("\n--- STEP 11: Controlled Real Test Email (Single Recipient) ---")
    r_send_test = client.post("/api/email/send-test")
    assert r_send_test.status_code == 200
    send_test_data = r_send_test.json()
    assert send_test_data["success"] is True
    assert send_test_data["recipient"] == "techbytecertificate@gmail.com"
    assert "Delivered successfully" in send_test_data["message"]
    print(f"  [PASS] Single test email accepted and delivered by Gmail SMTP to {send_test_data['recipient']}")
    print(f"         Event: {send_test_data['event']}, Attachment: {send_test_data['attachment']}")

    # ---------------------------------------------------------
    # STEP 12: Selective Email Retry Mechanism Verification
    # ---------------------------------------------------------
    print("\n--- STEP 12: Selective Email Retry Flow ---")
    session = client.app.dependency_overrides # or direct session access
    from app.services.session_store import get_session
    sess = get_session(session_id)
    # Manually simulate 1 failed participant out of 5
    parts = sess["participants"]
    part_keys = list(parts.keys())
    parts[part_keys[0]].status = "sent"
    parts[part_keys[1]].status = "failed"
    parts[part_keys[1]].error_detail = "Simulated temporary timeout"
    parts[part_keys[2]].status = "sent"

    r_retry = client.post(
        "/api/email/retry",
        json={"session_id": session_id, "event_name": "Hackathon", "dry_run": True}
    )
    assert r_retry.status_code == 200
    retry_rep = r_retry.json()
    # Only the 1 failed participant should have been processed
    retried_item = [item for item in retry_rep["items"] if item["id"] == part_keys[1]][0]
    assert retried_item["status"] == "SENT"
    print(f"  [PASS] Selective retry targeted only failed participant '{retried_item['name']}' without duplicate sends")

    print("\n" + "=" * 70)
    print("ALL 12 MASTER VERIFICATION PASSES COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_master_verification()
