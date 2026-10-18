import os
from pathlib import Path
from dotenv import load_dotenv

# Root of the Certificate_website project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Load .env file from project root
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Directory configurations
TEMPLATES_DIR = BASE_DIR / "templates"
GENERATED_DIR = BASE_DIR / "generated"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure runtime directories exist
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Application metadata
APP_TITLE = "TechByte Summit '26 Certificate Automation Portal"
APP_VERSION = "1.0.0"

# SMTP Settings - Environment-driven configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "techbytecertificate@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Techbyte Summit '26")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "techbytecertificate@gmail.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes")
EMAIL_DRY_RUN = os.getenv("EMAIL_DRY_RUN", "true").lower() in ("true", "1", "yes")

# Max upload size: 25 MB
MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024
