import os
import io
import zipfile
from pathlib import Path
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont

from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.config.settings import BASE_DIR, GENERATED_DIR, TEMPLATES_DIR
from app.config.template_coordinates import CANVAS_WIDTH, CANVAS_HEIGHT, get_template_config
from app.config.events import (
    get_event_by_name,
    get_template_path_for_event,
    validate_template_file
)
from app.models.schemas import Participant
from app.utils.sanitizer import sanitize_pdf_filename

# Register high quality TrueType fonts if available
FONTS_DIR = Path("C:/Windows/Fonts")
GEORGIA_BOLD_PATH = FONTS_DIR / "georgiab.ttf"
GEORGIA_PATH = FONTS_DIR / "georgia.ttf"
ARIAL_BOLD_PATH = FONTS_DIR / "arialbd.ttf"
ARIAL_PATH = FONTS_DIR / "arial.ttf"

REGISTERED_FONTS = {}

def init_fonts():
    global REGISTERED_FONTS
    try:
        if GEORGIA_BOLD_PATH.exists():
            pdfmetrics.registerFont(TTFont("Georgia-Bold", str(GEORGIA_BOLD_PATH)))
            REGISTERED_FONTS["Georgia-Bold"] = str(GEORGIA_BOLD_PATH)
        if GEORGIA_PATH.exists():
            pdfmetrics.registerFont(TTFont("Georgia", str(GEORGIA_PATH)))
            REGISTERED_FONTS["Georgia"] = str(GEORGIA_PATH)
        if ARIAL_BOLD_PATH.exists():
            pdfmetrics.registerFont(TTFont("Arial-Bold", str(ARIAL_BOLD_PATH)))
            REGISTERED_FONTS["Arial-Bold"] = str(ARIAL_BOLD_PATH)
        if ARIAL_PATH.exists():
            pdfmetrics.registerFont(TTFont("Arial", str(ARIAL_PATH)))
            REGISTERED_FONTS["Arial"] = str(ARIAL_PATH)
    except Exception as e:
        print(f"Font registration notice: {e}")

init_fonts()

def get_font_name_safe(preferred: str, fallback: str) -> str:
    """Return registered font name if available, else standard PDF font."""
    if preferred in REGISTERED_FONTS:
        return preferred
    return fallback

def calculate_scaled_font_size(
    text: str,
    font_name: str,
    initial_size: int,
    min_size: int,
    max_width: float,
    hard_min_size: int = 12
) -> int:
    """
    Intelligently scale font size downwards until text fits inside max_width.
    Guarantees no clipping or overflowing beyond designated certificate boundaries.
    """
    size = initial_size
    while size > min_size:
        text_w = pdfmetrics.stringWidth(text, font_name, size)
        if text_w <= max_width:
            return size
        size -= 1
    # If text is exceptionally long, continue scaling down to hard_min_size
    while size > hard_min_size:
        text_w = pdfmetrics.stringWidth(text, font_name, size)
        if text_w <= max_width:
            return size
        size -= 1
    return size

def generate_participant_pdf(
    participant: Participant,
    event_name: str,
    output_dir: Path,
    overlay_event_details: bool = False
) -> str:
    """
    Generate an individual high-resolution PDF certificate for a participant.
    Preserves original background PNG exactly without modifying graphics.
    """
    # Locate and validate direct background template
    template_img_path = get_template_path_for_event(event_name)
    validate_template_file(template_img_path)
    cfg = get_template_config(event_name)
    event_info = get_event_by_name(event_name)

    # Output filename and destination
    safe_filename = participant.certificate_filename or sanitize_pdf_filename(participant.name)
    output_pdf_path = output_dir / safe_filename

    # Create ReportLab canvas with exact 2000 x 1414 landscape dimensions
    c = canvas.Canvas(str(output_pdf_path), pagesize=(CANVAS_WIDTH, CANVAS_HEIGHT))

    # Draw template image as full-bleed background
    c.drawImage(
        str(template_img_path),
        0,
        0,
        width=CANVAS_WIDTH,
        height=CANVAS_HEIGHT,
        preserveAspectRatio=True,
        mask='auto'
    )

    # 1. Participant Name Overlay
    name_cfg = cfg["name"]
    name_font = get_font_name_safe(name_cfg["font_name"], name_cfg["fallback_font"])
    scaled_name_size = calculate_scaled_font_size(
        participant.name.upper(),
        name_font,
        name_cfg["font_size"],
        name_cfg["min_font_size"],
        name_cfg["max_width"]
    )
    c.setFont(name_font, scaled_name_size)
    c.setFillColorRGB(*name_cfg["color_rgb"])
    # ReportLab y coordinate (origin bottom-left)
    rl_name_y = CANVAS_HEIGHT - name_cfg["y"]
    c.drawCentredString(name_cfg["x"], rl_name_y, participant.name.upper())

    # 2. Class / Section Overlay (for Certificate of Recognition)
    if "class_section" in cfg:
        class_text = (getattr(participant, "class_section", None) or "").strip().upper()
        if class_text:
            class_cfg = cfg["class_section"]
            class_font = get_font_name_safe(class_cfg["font_name"], class_cfg["fallback_font"])
            scaled_class_size = calculate_scaled_font_size(
                class_text,
                class_font,
                class_cfg["font_size"],
                class_cfg["min_font_size"],
                class_cfg["max_width"]
            )
            c.setFont(class_font, scaled_class_size)
            c.setFillColorRGB(*class_cfg["color_rgb"])
            rl_class_y = CANVAS_HEIGHT - class_cfg["y"]
            c.drawCentredString(class_cfg["x"], rl_class_y, class_text)

    # 3. College Name Overlay (only for templates that require dynamic college name)
    if cfg.get("include_college", True) and "college" in cfg and participant.college_name:
        college_cfg = cfg["college"]
        college_font = get_font_name_safe(college_cfg["font_name"], college_cfg["fallback_font"])
        scaled_college_size = calculate_scaled_font_size(
            participant.college_name,
            college_font,
            college_cfg["font_size"],
            college_cfg["min_font_size"],
            college_cfg["max_width"]
        )
        c.setFont(college_font, scaled_college_size)
        c.setFillColorRGB(*college_cfg["color_rgb"])
        rl_college_y = CANVAS_HEIGHT - college_cfg["y"]
        c.drawCentredString(college_cfg["x"], rl_college_y, participant.college_name)

    # 3. Optional Event & Date Overlay (if configured and supported by template)
    if overlay_event_details and event_info and cfg.get("include_event", True) and "event" in cfg:
        event_cfg = cfg["event"]
        ev_font = get_font_name_safe(event_cfg["font_name"], event_cfg["fallback_font"])
        ev_size = calculate_scaled_font_size(
            event_name,
            ev_font,
            event_cfg["font_size"],
            event_cfg["min_font_size"],
            event_cfg["max_width"]
        )
        c.setFont(ev_font, ev_size)
        c.setFillColorRGB(*event_cfg["color_rgb"])
        c.drawCentredString(event_cfg["x"], CANVAS_HEIGHT - event_cfg["y"], event_name)

        date_cfg = cfg["date"]
        date_font = get_font_name_safe(date_cfg["font_name"], date_cfg["fallback_font"])
        event_date = event_info.get("date", "")
        c.setFont(date_font, date_cfg["font_size"])
        c.setFillColorRGB(*date_cfg["color_rgb"])
        c.drawCentredString(date_cfg["x"], CANVAS_HEIGHT - date_cfg["y"], event_date)

    c.save()
    return str(output_pdf_path)

def generate_participant_preview_image(
    participant: Participant,
    event_name: str,
    overlay_event_details: bool = False
) -> bytes:
    """
    Render an ultra-crisp image preview using Pillow at full resolution.
    Used for instant in-browser preview without requiring PDF renderer plugins.
    """
    # Locate and validate direct background template
    template_img_path = get_template_path_for_event(event_name)
    validate_template_file(template_img_path)
    cfg = get_template_config(event_name)
    event_info = get_event_by_name(event_name)
    
    img = Image.open(template_img_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Resolve fonts for PIL
    def get_pil_font(path_str: str, size: int):
        if path_str and os.path.exists(path_str):
            try:
                return ImageFont.truetype(path_str, size)
            except Exception:
                pass
        for fallback_name in ["georgia.ttf", "arial.ttf", "times.ttf"]:
            try:
                return ImageFont.truetype(fallback_name, size)
            except Exception:
                pass
        return ImageFont.load_default()

    # 1. Name
    name_cfg = cfg["name"]
    name_font_path = REGISTERED_FONTS.get(name_cfg["font_name"], str(GEORGIA_BOLD_PATH))
    name_text = participant.name.upper()

    # PIL font scaling
    name_size = name_cfg["font_size"]
    pil_font_name = get_pil_font(name_font_path, name_size)
    while name_size > 12:
        bbox = draw.textbbox((0, 0), name_text, font=pil_font_name)
        if (bbox[2] - bbox[0]) <= name_cfg["max_width"]:
            break
        name_size -= 1
        pil_font_name = get_pil_font(name_font_path, name_size)

    rgb_255 = tuple(int(c * 255) for c in name_cfg["color_rgb"])
    # anchor="ms" aligns horizontal middle and text baseline cleanly
    draw.text((name_cfg["x"], name_cfg["y"]), name_text, font=pil_font_name, fill=rgb_255, anchor="ms")

    # 2. Class / Section (for Certificate of Recognition)
    if "class_section" in cfg:
        class_text = (getattr(participant, "class_section", None) or "").strip().upper()
        if class_text:
            class_cfg = cfg["class_section"]
            class_font_path = REGISTERED_FONTS.get(class_cfg["font_name"], str(GEORGIA_BOLD_PATH))
            class_size = class_cfg["font_size"]
            pil_font_class = get_pil_font(class_font_path, class_size)
            while class_size > class_cfg.get("min_font_size", 12):
                bbox = draw.textbbox((0, 0), class_text, font=pil_font_class)
                if (bbox[2] - bbox[0]) <= class_cfg["max_width"]:
                    break
                class_size -= 1
                pil_font_class = get_pil_font(class_font_path, class_size)

            class_rgb_255 = tuple(int(c * 255) for c in class_cfg["color_rgb"])
            draw.text((class_cfg["x"], class_cfg["y"]), class_text, font=pil_font_class, fill=class_rgb_255, anchor="ms")

    # 3. College (only for templates that require dynamic college name)
    if cfg.get("include_college", True) and "college" in cfg and participant.college_name:
        college_cfg = cfg["college"]
        college_font_path = REGISTERED_FONTS.get(college_cfg["font_name"], str(GEORGIA_PATH))
        college_size = college_cfg["font_size"]
        pil_font_col = get_pil_font(college_font_path, college_size)
        while college_size > 12:
            bbox = draw.textbbox((0, 0), participant.college_name, font=pil_font_col)
            if (bbox[2] - bbox[0]) <= college_cfg["max_width"]:
                break
            college_size -= 1
            pil_font_col = get_pil_font(college_font_path, college_size)

        col_rgb_255 = tuple(int(c * 255) for c in college_cfg["color_rgb"])
        draw.text((college_cfg["x"], college_cfg["y"]), participant.college_name, font=pil_font_col, fill=col_rgb_255, anchor="ms")

    # 3. Event and Date if enabled
    if overlay_event_details and event_info and cfg.get("include_event", True) and "event" in cfg:
        ev_cfg = cfg["event"]
        ev_font = get_pil_font(REGISTERED_FONTS.get(ev_cfg["font_name"], str(GEORGIA_BOLD_PATH)), ev_cfg["font_size"])
        bbox_ev = draw.textbbox((0, 0), event_name, font=ev_font)
        draw.text((ev_cfg["x"] - (bbox_ev[2] - bbox_ev[0]) / 2, ev_cfg["y"] - (bbox_ev[3] - bbox_ev[1])), event_name, font=ev_font, fill=rgb_255)

        date_cfg = cfg["date"]
        date_font = get_pil_font(REGISTERED_FONTS.get(date_cfg["font_name"], str(GEORGIA_PATH)), date_cfg["font_size"])
        event_date = event_info.get("date", "")
        bbox_dt = draw.textbbox((0, 0), event_date, font=date_font)
        draw.text((date_cfg["x"] - (bbox_dt[2] - bbox_dt[0]) / 2, date_cfg["y"] - (bbox_dt[3] - bbox_dt[1])), event_date, font=date_font, fill=col_rgb_255)

    buffer = io.BytesIO()
    # Save as high-quality JPEG for fast web preview
    img.save(buffer, format="JPEG", quality=92, optimize=True)
    buffer.seek(0)
    return buffer.getvalue()

def create_zip_archive(pdf_paths: List[str], event_name: str, session_id: str) -> str:
    """Pack all generated participant PDF certificates into a single ZIP archive."""
    session_dir = GENERATED_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    event_slug = event_name.replace(" ", "_").replace("&", "and")
    zip_filename = f"Techbyte_Summit_26_{event_slug}_Certificates.zip"
    zip_filepath = session_dir / zip_filename

    with zipfile.ZipFile(str(zip_filepath), "w", zipfile.ZIP_DEFLATED) as zipf:
        for p in pdf_paths:
            path_obj = Path(p)
            if path_obj.exists():
                zipf.write(str(path_obj), arcname=path_obj.name)

    return str(zip_filepath)
