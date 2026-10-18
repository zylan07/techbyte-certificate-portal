import re
import unicodedata

def sanitize_text(text: str) -> str:
    """
    Clean and normalize participant and college text while strictly
    preserving Indian names, initials, dots, and Unicode characters.
    """
    if not text:
        return ""
    # Normalize unicode to NFC (canonical composition)
    normalized = unicodedata.normalize("NFC", str(text))
    # Replace multiple internal spaces with a single space
    cleaned = re.sub(r"\s+", " ", normalized)
    return cleaned.strip()

def sanitize_pdf_filename(participant_name: str) -> str:
    """
    Produce a clean, safe filename matching the convention:
    FirstName_LastName_Techbyte_Summit_26.pdf
    """
    cleaned_name = sanitize_text(participant_name)
    if not cleaned_name:
        cleaned_name = "Participant"
    
    # Replace dots and spaces with underscore
    safe_name = re.sub(r"[.\s]+", "_", cleaned_name)
    # Remove any characters not alphanumeric, underscore, or hyphen
    safe_name = re.sub(r"[^\w\-]", "", safe_name)
    # Collapse consecutive underscores
    safe_name = re.sub(r"_+", "_", safe_name).strip("_")
    
    if not safe_name:
        safe_name = "Participant"
        
    return f"{safe_name}_Techbyte_Summit_26.pdf"

def sanitize_session_id(session_id: str) -> str:
    """Ensure session_id contains only alphanumeric and hyphens/underscores."""
    return re.sub(r"[^\w\-]", "", session_id)
