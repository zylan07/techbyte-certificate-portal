import os
import smtplib
import re
import socket
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.config.settings import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_NAME,
    SMTP_FROM_EMAIL,
    SMTP_USE_TLS,
    SMTP_USE_SSL,
    EMAIL_DRY_RUN
)
from app.models.schemas import Participant

logger = logging.getLogger("email_service")

Tuple_Text = Tuple[str, str]
Tuple_Result = Tuple[bool, str]

# Regex pattern for email validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_recipient_email(email: str | None) -> Tuple_Result:
    """Validates participant recipient email format."""
    if not email or not isinstance(email, str) or not email.strip():
        return False, "Missing recipient email address"
    email_clean = email.strip()
    if not EMAIL_REGEX.match(email_clean):
        return False, f"Invalid recipient email address: '{email_clean}'"
    return True, ""

def mask_email(email: str) -> str:
    """Mask email for privacy in logs (e.g., a***r@example.com)."""
    if not email or "@" not in email:
        return email or ""
    parts = email.split("@", 1)
    user, domain = parts[0], parts[1]
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
    return f"{masked_user}@{domain}"

def render_email_content(participant_name: str, event_name: str) -> Tuple_Text:
    """
    Renders professional dynamic subject and body adhering to Techbyte Summit '26 specifications.
    Dynamically handles Certificate of Recognition vs Event Participation.
    """
    if "recognition" in event_name.lower():
        subject = "Certificate of Recognition – Techbyte Summit ’26"
        body = f"""Dear {participant_name},

In recognition of your passion, dedication, and relentless efforts in making TechByte Summit ’26, organized by the Department of Computer Science and Engineering, KPR Institute of Engineering and Technology, Coimbatore, a remarkable success.

Please find your Certificate of Recognition attached to this email.

Regards,
Techbyte Summit ’26
Department of Computer Science and Engineering
KPR Institute of Engineering and Technology
"""
        return subject, body

    subject = f"Certificate of Participation – Techbyte Summit ’26 – {event_name}"
    body = f"""Dear {participant_name},

Thank you for participating in {event_name} as part of Techbyte Summit ’26, organised by the Department of Computer Science and Engineering, KPR Institute of Engineering and Technology, Coimbatore.

Please find your Certificate of Participation attached to this email.

Regards,
Techbyte Summit ’26
Department of Computer Science and Engineering
KPR Institute of Engineering and Technology
"""
    return subject, body

def is_smtp_configured() -> bool:
    """Check if valid non-empty SMTP credentials are provided."""
    return bool(
        SMTP_HOST and
        SMTP_HOST.strip() and
        SMTP_USERNAME and
        SMTP_USERNAME.strip() and
        SMTP_PASSWORD and
        SMTP_PASSWORD.strip() not in ("your_app_specific_password_here", "")
    )

def is_dry_run_active(explicit_dry_run: Optional[bool] = None) -> bool:
    """Determine whether dry-run mode is active."""
    if explicit_dry_run is not None:
        return explicit_dry_run
    return EMAIL_DRY_RUN

def get_email_status_dict() -> Dict[str, Any]:
    """
    Returns public non-secret SMTP configuration status for organizer UI/API.
    Never exposes passwords or secret keys.
    """
    configured = is_smtp_configured()
    dry_run = is_dry_run_active()
    return {
        "configured": configured,
        "test_mode": dry_run or not configured,
        "dry_run": dry_run,
        "sender_email": SMTP_FROM_EMAIL,
        "smtp_host": SMTP_HOST if SMTP_HOST else "Not configured",
        "smtp_port": SMTP_PORT,
        "authentication": "Configured" if bool(SMTP_USERNAME and SMTP_PASSWORD) else "Not configured",
        "from_name": SMTP_FROM_NAME,
        "use_tls": SMTP_USE_TLS,
        "use_ssl": SMTP_USE_SSL,
        "notice": (
            "Dry run mode active (emails simulated, no live dispatch)"
            if dry_run
            else (
                f"Live SMTP active ({SMTP_HOST}:{SMTP_PORT})"
                if configured
                else "SMTP is not configured (credentials missing in .env)"
            )
        )
    }

def test_smtp_connection() -> Tuple_Result:
    """
    Tests SMTP connectivity and authentication without dispatching any emails.
    Returns (True, message) or (False, safe_error_message). Never leaks password.
    Categorizes errors:
    - SMTP_HOST missing
    - SMTP_USERNAME missing
    - SMTP_PASSWORD missing
    - Authentication failed
    - Connection refused
    - TLS error
    - SSL error
    - Sender rejected
    """
    if not SMTP_HOST or not SMTP_HOST.strip():
        return False, "SMTP_HOST missing: Please set SMTP_HOST in .env."
    if not SMTP_USERNAME or not SMTP_USERNAME.strip():
        return False, "SMTP_USERNAME missing: Please set SMTP_USERNAME in .env."
    if not SMTP_PASSWORD or not SMTP_PASSWORD.strip() or SMTP_PASSWORD == "your_app_specific_password_here":
        return False, "SMTP_PASSWORD missing: Please set SMTP_PASSWORD in .env."

    server = None
    try:
        if SMTP_USE_SSL:
            try:
                server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
            except Exception as e:
                return False, f"SSL error connecting to {SMTP_HOST}:{SMTP_PORT}: {str(e)}"
        else:
            try:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            except (ConnectionRefusedError, socket.error):
                return False, f"Connection refused: Could not connect to {SMTP_HOST} on port {SMTP_PORT}."
            except (socket.timeout, TimeoutError):
                return False, f"Connection timed out: Host {SMTP_HOST} did not respond on port {SMTP_PORT}."
            except Exception as e:
                return False, f"Connection failed to {SMTP_HOST}:{SMTP_PORT}: {str(e)}"

            if SMTP_USE_TLS:
                try:
                    server.starttls()
                except Exception as e:
                    return False, f"TLS error: STARTTLS failed on {SMTP_HOST}: {str(e)}"

        try:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        except smtplib.SMTPAuthenticationError:
            return False, f"Authentication failed: Invalid credentials for user '{SMTP_USERNAME}'."
        except smtplib.SMTPException as e:
            safe_msg = str(e).replace(SMTP_PASSWORD, "******") if SMTP_PASSWORD else str(e)
            return False, f"Authentication failed: {safe_msg}"

        return True, f"SMTP connection and authentication successful ({SMTP_HOST}:{SMTP_PORT})."

    except smtplib.SMTPAuthenticationError:
        return False, f"Authentication failed for user '{SMTP_USERNAME}'."
    except (ConnectionRefusedError, socket.error):
        return False, f"Connection refused by {SMTP_HOST}:{SMTP_PORT}."
    except (socket.timeout, TimeoutError):
        return False, f"Connection timed out connecting to {SMTP_HOST}:{SMTP_PORT}."
    except smtplib.SMTPException as e:
        safe_msg = str(e).replace(SMTP_PASSWORD, "******") if SMTP_PASSWORD else str(e)
        return False, f"SMTP error: {safe_msg}"
    except Exception as e:
        safe_msg = str(e).replace(SMTP_PASSWORD, "******") if SMTP_PASSWORD else str(e)
        return False, f"Connection check failed: {safe_msg}"
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass

def send_individual_email(
    participant: Participant,
    event_name: str,
    pdf_path: str,
    dry_run: Optional[bool] = None
) -> Tuple_Result:
    """
    Send an individual certificate email to a participant.
    Attaches strictly the participant's own PDF matching their name and selected event.
    In dry run mode, generates certificates, prepares email, and logs intended delivery without sending.
    If live mode is attempted without valid SMTP configuration, returns an explicit error.
    """
    # 1. Validate recipient email address
    is_valid_email, email_err = validate_recipient_email(participant.mail_id)
    if not is_valid_email:
        return False, email_err

    # 2. Verify certificate PDF existence
    path_obj = Path(pdf_path)
    if not path_obj.exists():
        return False, f"Certificate PDF file does not exist at {pdf_path}"

    subject, body_text = render_email_content(participant.name, event_name)
    active_dry_run = is_dry_run_active(dry_run)

    # 3. Handle Dry Run mode (safe test mode)
    if active_dry_run:
        masked = mask_email(participant.mail_id)
        logger.info(
            f"[EMAIL DRY RUN] Intended recipient: {masked} | Participant: {participant.name} | "
            f"Event: {event_name} | Attachment: {path_obj.name}"
        )
        return True, f"Dry run: Email prepared for {masked} with attachment '{path_obj.name}' (not sent)."

    # 4. Live dispatch validation: if SMTP credentials missing, reject clearly
    if not is_smtp_configured():
        return False, "SMTP is not configured. Please set SMTP host and credentials in .env, or enable EMAIL_DRY_RUN=true for safe testing."

    # 5. Live SMTP transmission
    server = None
    try:
        msg = MIMEMultipart()
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = participant.mail_id.strip()
        msg["Subject"] = subject

        # Attach text body
        msg.attach(MIMEText(body_text, "plain", "utf-8"))

        # Read and attach participant PDF
        with open(str(path_obj), "rb") as f:
            pdf_bytes = f.read()

        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=path_obj.name
        )
        msg.attach(attachment)

        # Connect to SMTP server
        if SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
            if SMTP_USE_TLS:
                server.starttls()

        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [participant.mail_id.strip()], msg.as_string())
        masked = mask_email(participant.mail_id)
        logger.info(f"Delivered certificate email to {masked} for event {event_name}")
        return True, "Delivered successfully"

    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed. Check credentials in .env."
    except smtplib.SMTPRecipientsRefused:
        return False, f"Sender rejected / Recipient rejected: {mask_email(participant.mail_id)}"
    except Exception as e:
        safe_msg = str(e).replace(SMTP_PASSWORD, "******") if SMTP_PASSWORD else str(e)
        return False, f"SMTP delivery error: {safe_msg}"
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass
