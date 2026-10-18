"""
Centralized Certificate Coordinate and Typography Configuration.
Dimensions are based on 2000 x 1414 landscape resolution.
Image coordinates: (0, 0) is top-left.
ReportLab coordinates: (0, 0) is bottom-left, so rl_y = 1414 - img_y.
"""

from typing import Dict, Any

CANVAS_WIDTH = 2000
CANVAS_HEIGHT = 1414


RECOGNITION_TYPOGRAPHY = {
    "name": {
        "x": 1503,                  # Centered on blank underline after "Mr. / Ms." (x=1178 to x=1828)
        "y": 496,                   # Optimal baseline sitting cleanly atop underline (y=502)
        "max_width": 630,           # Maximum width boundary before automatic downscaling
        "font_size": 34,            # Base font size
        "min_font_size": 16,        # Minimum scaled font size
        "font_name": "Georgia-Bold",
        "fallback_font": "Helvetica-Bold",
        "color_rgb": (0.06, 0.09, 0.16),  # Charcoal / Black
    },
    "class_section": {
        "x": 440,                   # Centered on blank underline after "of" (x=221 to x=660)
        "y": 544,                   # Optimal baseline sitting cleanly atop underline (y=550)
        "max_width": 420,           # Maximum width boundary before automatic downscaling
        "font_size": 30,            # Base font size
        "min_font_size": 14,        # Minimum scaled font size
        "font_name": "Georgia-Bold",
        "fallback_font": "Helvetica-Bold",
        "color_rgb": (0.06, 0.09, 0.16),
    },
    "include_college": False,       # Fixed in template: "KPR Institute of Engineering and Technology, Coimbatore"
    "include_event": False,         # Fixed in template body
    "include_date": False,          # Fixed in template: "Held on 14.10.2026 & 15.10.2026"
}

CERTIFICATE_TYPOGRAPHY = {
    "name": {
        "x": 1375,                  # Centered on underline (x=967 to x=1782, midpoint 1374.5)
        "y": 646,                   # Baseline cleanly sitting atop underline (y=661)
        "max_width": 800,           # Maximum width boundary before automatic scaling
        "font_size": 38,            # Optimal base font size
        "min_font_size": 20,        # Minimum scaled font size
        "font_name": "Georgia-Bold",
        "fallback_font": "Helvetica-Bold",
        "color_rgb": (0.06, 0.09, 0.16),  # Charcoal / Black
    },
    "college": {
        "x": 943,                   # Centered on underline (x=141 to x=1745)
        "y": 700,                   # Baseline cleanly sitting atop underline (y=714)
        "max_width": 1560,          # Maximum width boundary
        "font_size": 30,            # Optimal base font size
        "min_font_size": 18,        # Minimum scaled font size
        "font_name": "Georgia",
        "fallback_font": "Helvetica",
        "color_rgb": (0.12, 0.16, 0.24),
    },
    "event": {
        "x": 820,                   # Centered between "participated in" and "as part of"
        "y": 760,
        "max_width": 580,
        "font_size": 26,
        "min_font_size": 16,
        "font_name": "Georgia-Bold",
        "fallback_font": "Helvetica-Bold",
        "color_rgb": (0.06, 0.09, 0.16),
    },
    "date": {
        "x": 860,                   # Centered between "held on" and "."
        "y": 921,
        "max_width": 370,
        "font_size": 26,
        "min_font_size": 16,
        "font_name": "Georgia",
        "fallback_font": "Helvetica",
        "color_rgb": (0.12, 0.16, 0.24),
    }
}

def get_template_config(event_name: str) -> Dict[str, Any]:
    """
    Returns coordinate and typography configuration for certificate generation.
    Resolves the direct template PNG path based on the event name.
    Strictly raises ValueError if event is invalid. NEVER silently falls back to Paper Presentation.
    """
    from app.config.events import get_template_filename_for_event
    filename = get_template_filename_for_event(event_name)

    if event_name == "Certificate of Recognition" or "recognition" in event_name.lower():
        cfg = {
            "template_filename": filename,
            "image_path": f"templates/{filename}",
            "name": dict(RECOGNITION_TYPOGRAPHY["name"]),
            "class_section": dict(RECOGNITION_TYPOGRAPHY["class_section"]),
            "include_college": False,
            "include_event": False,
            "include_date": False,
        }
        return cfg

    cfg = {
        "template_filename": filename,
        "image_path": f"templates/{filename}",
        "name": dict(CERTIFICATE_TYPOGRAPHY["name"]),
        "college": dict(CERTIFICATE_TYPOGRAPHY["college"]),
        "event": dict(CERTIFICATE_TYPOGRAPHY["event"]),
        "date": dict(CERTIFICATE_TYPOGRAPHY["date"]),
        "include_college": True,
        "include_event": True,
        "include_date": True,
    }
    return cfg
