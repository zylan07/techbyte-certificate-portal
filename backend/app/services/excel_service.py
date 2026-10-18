import io
import uuid
from typing import Dict, Any, List, Tuple
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from app.models.schemas import Participant, ValidationSummary
from app.utils.sanitizer import sanitize_text, sanitize_pdf_filename
from app.utils.validator import is_valid_email

def match_column(columns: List[str], targets: List[str]) -> str | None:
    """Find a column header that matches one of the target names (case-insensitive)."""
    norm_targets = [t.lower().replace(" ", "").replace("_", "") for t in targets]
    for col in columns:
        norm_col = str(col).lower().replace(" ", "").replace("_", "")
        if norm_col in norm_targets:
            return col
    return None

def parse_and_validate_file(file_bytes: bytes, filename: str, event_name: str | None = None) -> ValidationSummary:
    """
    Parse an uploaded .xlsx, .xls, or .csv file and validate rows against requirements.
    """
    session_id = str(uuid.uuid4())
    
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("The uploaded spreadsheet file is empty.")

    # Read into pandas DataFrame
    lower_name = filename.lower()
    if not (lower_name.endswith(".csv") or lower_name.endswith(".xls") or lower_name.endswith(".xlsx")):
        raise ValueError("Unsupported file format. Please upload .xlsx, .xls, or .csv")

    try:
        if lower_name.endswith(".csv"):
            # Try utf-8 first, fallback to latin-1
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Failed to read file: {str(e)}")

    if df.empty:
        raise ValueError("The uploaded spreadsheet contains no data rows.")

    is_recognition = bool(event_name and ("recognition" in event_name.lower()))

    # Match required columns
    columns = list(df.columns)
    name_col = match_column(columns, ["Name", "ParticipantName", "StudentName", "CandidateName", "RecipientName"])
    class_col = match_column(columns, ["Class / Section", "Class/Section", "Class Section", "Class", "Section", "Department", "Class_Section"])
    college_col = match_column(columns, ["College Name", "CollegeName", "College", "Institution", "InstitutionName"])
    email_col = match_column(columns, ["Mail ID", "MailID", "Email", "EmailID", "Email Address", "MailAddress", "Mail"])

    missing = []
    if not name_col:
        missing.append("Name")
    if is_recognition:
        if not class_col:
            missing.append("Class / Section")
    else:
        if not college_col:
            missing.append("College Name")
    if not email_col:
        missing.append("Mail ID")

    if missing:
        if is_recognition:
            expected_cols = "'Name', 'Class / Section', 'Mail ID'"
        else:
            expected_cols = "'Name', 'College Name', 'Mail ID'"
        raise ValueError(
            f"Missing required column(s): {', '.join(missing)}. "
            f"Expected columns: {expected_cols}."
        )

    participants: List[Participant] = []
    errors: List[Dict[str, Any]] = []

    seen_emails: Dict[str, int] = {}
    seen_records: Dict[Tuple[str, str], int] = {}
    seen_filenames: Dict[str, int] = {}

    total_records = 0
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for idx, row in df.iterrows():
        excel_row_num = idx + 2  # 1-indexed, accounting for header row
        
        raw_name = "" if (not name_col or pd.isna(row[name_col])) else str(row[name_col])
        raw_class = "" if (not class_col or pd.isna(row[class_col])) else str(row[class_col])
        raw_college = "" if (not college_col or pd.isna(row[college_col])) else str(row[college_col])
        raw_email = "" if (not email_col or pd.isna(row[email_col])) else str(row[email_col])

        name = sanitize_text(raw_name)
        class_section = sanitize_text(raw_class)
        college = sanitize_text(raw_college)
        email = sanitize_text(raw_email).lower()

        # For Certificate of Recognition, college is fixed in the template
        if is_recognition and not college:
            college = "KPR Institute of Engineering and Technology, Coimbatore"

        # Gracefully skip completely blank trailing rows
        if not name and not raw_email.strip() and (not is_recognition or not class_section) and (is_recognition or not college):
            continue

        total_records += 1
        row_errors: List[str] = []

        if not name:
            row_errors.append("Participant Name is empty")
        if is_recognition:
            if not class_section:
                row_errors.append("Class / Section is empty")
        else:
            if not college:
                row_errors.append("College Name is empty")
        if not email:
            row_errors.append("Mail ID is empty")
        elif not is_valid_email(email):
            row_errors.append(f"Invalid email format: '{raw_email.strip()}'")

        is_duplicate = False
        duplicate_reason = ""

        # Check duplicate email
        if email and is_valid_email(email):
            if email in seen_emails:
                is_duplicate = True
                duplicate_reason = f"Duplicate email address (already seen in row {seen_emails[email]})"
            else:
                seen_emails[email] = excel_row_num

        # Check duplicate participant record
        if name:
            rec_key = (name.lower(), class_section.lower(), email) if is_recognition else (name.lower(), college.lower())
            if rec_key in seen_records:
                is_duplicate = True
                if not duplicate_reason:
                    duplicate_reason = f"Duplicate participant record (matches row {seen_records[rec_key]})"
            else:
                seen_records[rec_key] = excel_row_num

        if row_errors:
            status = "invalid"
            error_detail = "; ".join(row_errors)
            invalid_count += 1
            errors.append({
                "row": excel_row_num,
                "name": name or "(empty)",
                "college": college or "(empty)",
                "email": raw_email.strip() or "(empty)",
                "error": error_detail,
                "type": "error"
            })
        elif is_duplicate:
            status = "duplicate"
            error_detail = duplicate_reason
            duplicate_count += 1
            errors.append({
                "row": excel_row_num,
                "name": name,
                "college": college,
                "email": email,
                "error": duplicate_reason,
                "type": "duplicate"
            })
        else:
            status = "ready"
            error_detail = None
            valid_count += 1

        p_id = f"{session_id}_{excel_row_num}"
        
        # Ensure unique certificate filenames across the batch
        if name:
            base_filename = sanitize_pdf_filename(name)
            if base_filename in seen_filenames:
                seen_filenames[base_filename] += 1
                suffix = f"_{seen_filenames[base_filename]}"
                cert_filename = base_filename.replace("_Techbyte_Summit_26.pdf", f"{suffix}_Techbyte_Summit_26.pdf")
            else:
                seen_filenames[base_filename] = 1
                cert_filename = base_filename
        else:
            cert_filename = f"Participant_{excel_row_num}_Techbyte_Summit_26.pdf"

        participant = Participant(
            id=p_id,
            row_num=excel_row_num,
            name=name,
            class_section=class_section if is_recognition else None,
            college_name=college,
            mail_id=email,
            status=status,
            error_detail=error_detail,
            certificate_filename=cert_filename,
            certificate_path=None
        )
        participants.append(participant)

    return ValidationSummary(
        session_id=session_id,
        total_records=total_records,
        valid_records=valid_count,
        invalid_records=invalid_count,
        duplicate_records=duplicate_count,
        participants=participants,
        errors=errors
    )

def generate_sample_excel_template(event_name: str | None = None) -> bytes:
    """
    Generate the official downloadable TechByte Summit '26 Excel participant template.
    For Certificate of Recognition: headers are Name | Mail ID.
    For Participation: headers are Name | College Name | Mail ID.
    """
    is_recognition = bool(event_name and ("recognition" in event_name.lower()))
    if is_recognition:
        wb = Workbook()
        ws = wb.active
        ws.title = "Recognition Recipients"

        header_fill = PatternFill(start_color="111827", end_color="111827", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        data_font = Font(name="Calibri", size=11)
        thin_border = Border(
            left=Side(style='thin', color='E5E7EB'),
            right=Side(style='thin', color='E5E7EB'),
            top=Side(style='thin', color='E5E7EB'),
            bottom=Side(style='thin', color='E5E7EB')
        )

        headers = ["Name", "Class / Section", "Mail ID"]
        ws.append(headers)

        sample_rows = [
            ["SATHYA R V", "III CSE D", "example@gmail.com"],
            ["STUDENT NAME", "II CSE A", "student@gmail.com"],
            ["ARUN KUMAR M", "III CSE B", "arun.kumar@gmail.com"],
            ["PRIYA DHARSHINI S", "IV CSE C", "priyadharshini.s@outlook.com"]
        ]

        for row in sample_rows:
            ws.append(row)

        for col_idx in range(1, 4):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for row_idx in range(2, len(sample_rows) + 2):
            for col_idx in range(1, 4):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.font = data_font
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="left")

        ws.column_dimensions['A'].width = 32
        ws.column_dimensions['B'].width = 24
        ws.column_dimensions['C'].width = 36

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()
    wb = Workbook()
    ws = wb.active
    ws.title = "Participants"

    # Styling definitions
    header_fill = PatternFill(start_color="111827", end_color="111827", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Calibri", size=11)
    thin_border = Border(
        left=Side(style='thin', color='E5E7EB'),
        right=Side(style='thin', color='E5E7EB'),
        top=Side(style='thin', color='E5E7EB'),
        bottom=Side(style='thin', color='E5E7EB')
    )

    headers = ["Name", "College Name", "Mail ID"]
    ws.append(headers)

    sample_rows = [
        ["Arun Kumar", "KPR Institute of Engineering and Technology", "arun.kumar@gmail.com"],
        ["Mohammed Abdul Rahman", "PSG College of Technology", "m.abdulrahman@yahoo.com"],
        ["Priya Dharshini S", "Coimbatore Institute of Technology", "priyadharshini.s@outlook.com"],
        ["Karthikeyan M", "Sri Krishna College of Engineering and Technology", "karthik.m26@gmail.com"],
        ["Sneha Lakshmi V", "Government College of Technology, Coimbatore", "snehav.tech@gmail.com"]
    ]

    for row in sample_rows:
        ws.append(row)

    # Style header row
    for col_idx in range(1, 4):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Style data rows
    for row_idx in range(2, len(sample_rows) + 2):
        for col_idx in range(1, 4):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = data_font
            cell.border = thin_border
            if col_idx == 3:
                cell.alignment = Alignment(horizontal="left")
            else:
                cell.alignment = Alignment(horizontal="left")

    # Column widths
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 48
    ws.column_dimensions['C'].width = 36

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()

def generate_validation_error_report(errors: List[Dict[str, Any]]) -> bytes:
    """Generate an Excel workbook listing all validation errors and duplicates."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Validation Errors"

    header_fill = PatternFill(start_color="991B1B", end_color="991B1B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    headers = ["Row #", "Type", "Participant Name", "College Name", "Mail ID", "Validation Issue"]
    ws.append(headers)

    for item in errors:
        ws.append([
            item.get("row", ""),
            item.get("type", "error").upper(),
            item.get("name", ""),
            item.get("college", ""),
            item.get("email", ""),
            item.get("error", "")
        ])

    for col_idx in range(1, 7):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font

    ws.column_dimensions['A'].width = 10
    ws.column_dimensions['B'].width = 14
    ws.column_dimensions['C'].width = 28
    ws.column_dimensions['D'].width = 40
    ws.column_dimensions['E'].width = 32
    ws.column_dimensions['F'].width = 50

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()
