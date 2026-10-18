import io
import sys
import os
import shutil
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.excel_service import generate_sample_excel_template, parse_and_validate_file
from app.services.certificate_service import (
    generate_participant_pdf,
    generate_participant_preview_image,
    create_zip_archive
)
from app.models.schemas import Participant
from app.services.email_service import send_individual_email
from app.config.settings import GENERATED_DIR

def run_tests():
    print("--- 1. Testing Excel Template Generation ---")
    template_bytes = generate_sample_excel_template()
    assert len(template_bytes) > 0, "Template bytes empty"
    print(f"Generated template size: {len(template_bytes)} bytes")

    print("\n--- 2. Testing Parsing & Validation ---")
    summary = parse_and_validate_file(template_bytes, "sample.xlsx")
    print(f"Total: {summary.total_records}, Valid: {summary.valid_records}, Invalid: {summary.invalid_records}, Duplicates: {summary.duplicate_records}")
    assert summary.valid_records == 5, f"Expected 5 valid records, got {summary.valid_records}"
    assert len(summary.participants) == 5

    print("\n--- 3. Testing PDF Certificate Generation for Standard Event ---")
    test_session_dir = GENERATED_DIR / "test_session"
    test_session_dir.mkdir(parents=True, exist_ok=True)

    p1 = summary.participants[0]
    pdf_p1 = generate_participant_pdf(p1, "Paper Presentation", test_session_dir)
    assert os.path.exists(pdf_p1), "PDF file does not exist"
    print(f"Generated PDF for '{p1.name}': {pdf_p1} (Size: {os.path.getsize(pdf_p1)} bytes)")

    print("\n--- 4. Testing PDF Certificate Generation with Extremely Long Name & College (Auto-Scaling) ---")
    p_long = Participant(
        id="test_long",
        row_num=99,
        name="Mohammed Abdul Rahman Mohamed Al-Husseini",
        college_name="KPR Institute of Engineering and Technology, Autonomous, Affiliated to Anna University, Coimbatore",
        mail_id="long.name@test.com",
        status="ready"
    )
    pdf_long = generate_participant_pdf(p_long, "Coding Contest", test_session_dir)
    assert os.path.exists(pdf_long), "Long PDF file does not exist"
    print(f"Generated PDF for long name: {pdf_long} (Size: {os.path.getsize(pdf_long)} bytes)")

    print("\n--- 5. Testing Preview Image Generation ---")
    preview_bytes = generate_participant_preview_image(p1, "Paper Presentation")
    assert len(preview_bytes) > 10000, "Preview image bytes too small"
    print(f"Generated preview image size: {len(preview_bytes)} bytes")

    print("\n--- 6. Testing ZIP Archive Creation ---")
    zip_path = create_zip_archive([pdf_p1, pdf_long], "Paper Presentation", "test_session")
    assert os.path.exists(zip_path), "ZIP archive does not exist"
    print(f"Created ZIP: {zip_path} (Size: {os.path.getsize(zip_path)} bytes)")

    print("\n--- 7. Testing Email Service in Simulation Mode ---")
    success, msg = send_individual_email(p1, "Paper Presentation", pdf_p1)
    print(f"Email dispatch status: success={success}, msg='{msg}'")
    assert success is True, "Simulated email sending failed"

    # Clean up test session directory
    if test_session_dir.exists():
        shutil.rmtree(test_session_dir)

    print("\n==========================================")
    print("ALL 7 BACKEND SERVICE TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
