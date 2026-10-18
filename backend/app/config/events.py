"""
Centralized Event Configuration for TECHBYTE SUMMIT '26.
Direct Event-to-Template mapping where all PNG templates are stored
directly inside the templates/ directory.
"""

from typing import Dict, Any, List
from pathlib import Path
from PIL import Image

from app.config.settings import TEMPLATES_DIR

# Canvas dimensions
CANVAS_WIDTH = 2000
CANVAS_HEIGHT = 1414

# Canonical 7 event names
CANONICAL_EVENTS: List[str] = [
    "Paper Presentation",
    "Project Presentation",
    "Poster Presentation",
    "Executive Development Programme",
    "Conclave on Emergent Trends",
    "Coding Contest",
    "Hackathon",
]

# Direct event-to-file mapping (canonical events + supported aliases)
EVENT_TEMPLATE_MAP: Dict[str, str] = {
    # Canonical 7
    "Paper Presentation": "Paper Presentation Participation.png",
    "Project Presentation": "Project Presentation Participation.png",
    "Poster Presentation": "Poster Presentation Participation.png",
    "Executive Development Programme": "Executive Development Programme Participation.png",
    "Conclave on Emergent Trends": "Conclave on Emergent Trends Participation.png",
    "Coding Contest": "Coding Contest Participation.png",
    "Hackathon": "Hackathon Participation.png",
    # Supported aliases
    "12-Hour Hackathon": "Hackathon Participation.png",
    "12 Hour Hackathon": "Hackathon Participation.png",
    "EDP": "Executive Development Programme Participation.png",
    "GeeksforGeeks Coding Contest": "Coding Contest Participation.png",
    "GfG Coding Contest": "Coding Contest Participation.png",
    "Certificate of Recognition": "Certificate_of_recognition.png",
    "Recognition": "Certificate_of_recognition.png",
}

# Template classification metadata (STANDARD vs GEEKSFORGEEKS)
EVENT_CATEGORY_MAP: Dict[str, str] = {
    "Paper Presentation": "standard",
    "Project Presentation": "standard",
    "Poster Presentation": "standard",
    "Executive Development Programme": "standard",
    "Conclave on Emergent Trends": "standard",
    "Coding Contest": "geeksforgeeks",
    "Hackathon": "geeksforgeeks",
    "12-Hour Hackathon": "geeksforgeeks",
    "12 Hour Hackathon": "geeksforgeeks",
    "EDP": "standard",
    "GeeksforGeeks Coding Contest": "geeksforgeeks",
    "GfG Coding Contest": "geeksforgeeks",
    "Certificate of Recognition": "recognition",
    "Recognition": "recognition",
}

# Supported aliases mapping to canonical event names
EVENT_ALIAS_MAP: Dict[str, str] = {
    "paper presentation": "Paper Presentation",
    "project presentation": "Project Presentation",
    "poster presentation": "Poster Presentation",
    "executive development programme": "Executive Development Programme",
    "edp": "Executive Development Programme",
    "conclave on emergent trends": "Conclave on Emergent Trends",
    "coding contest": "Coding Contest",
    "geeksforgeeks coding contest": "Coding Contest",
    "gfg coding contest": "Coding Contest",
    "hackathon": "Hackathon",
    "12-hour hackathon": "Hackathon",
    "12 hour hackathon": "Hackathon",
    "certificate of recognition": "Certificate of Recognition",
    "recognition": "Certificate of Recognition",
}

_HACKATHON_CONFIG = {
    "id": "hackathon",
    "name": "Hackathon",
    "template": "geeksforgeeks",
    "template_filename": "Hackathon Participation.png",
    "date": "14 & 15 October 2026",
    "department": "Department of Computer Science and Engineering",
    "institution": "KPR Institute of Engineering and Technology",
    "description": "Overnight product development hackathon in partnership with GeeksforGeeks.",
}

EVENTS_CONFIG: Dict[str, Dict[str, Any]] = {
    "Paper Presentation": {
        "id": "paper-presentation",
        "name": "Paper Presentation",
        "template": "standard",
        "template_filename": "Paper Presentation Participation.png",
        "date": "14 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Technical paper presentation evaluating research innovation and methodology.",
    },
    "Project Presentation": {
        "id": "project-presentation",
        "name": "Project Presentation",
        "template": "standard",
        "template_filename": "Project Presentation Participation.png",
        "date": "14 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Working prototype and engineering project demonstration.",
    },
    "Poster Presentation": {
        "id": "poster-presentation",
        "name": "Poster Presentation",
        "template": "standard",
        "template_filename": "Poster Presentation Participation.png",
        "date": "14 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Visual technical poster display and conceptual interaction.",
    },
    "Executive Development Programme": {
        "id": "executive-development-programme",
        "name": "Executive Development Programme",
        "template": "standard",
        "template_filename": "Executive Development Programme Participation.png",
        "date": "15 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Professional leadership and executive skill acceleration programme.",
    },
    "Conclave on Emergent Trends": {
        "id": "conclave-on-emergent-trends",
        "name": "Conclave on Emergent Trends",
        "template": "standard",
        "template_filename": "Conclave on Emergent Trends Participation.png",
        "date": "15 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Industry panel dialogue on emergent technological horizons.",
    },
    "Coding Contest": {
        "id": "coding-contest",
        "name": "Coding Contest",
        "template": "geeksforgeeks",
        "template_filename": "Coding Contest Participation.png",
        "date": "15 October 2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology",
        "description": "Algorithmic speed problem-solving contest powered by GeeksforGeeks.",
    },
    "Hackathon": _HACKATHON_CONFIG,
    "Certificate of Recognition": {
        "id": "certificate-of-recognition",
        "name": "Certificate of Recognition",
        "template": "recognition",
        "template_filename": "Certificate_of_recognition.png",
        "date": "14.10.2026 & 15.10.2026",
        "department": "Department of Computer Science and Engineering",
        "institution": "KPR Institute of Engineering and Technology, Coimbatore",
        "description": "Recognition for passion, dedication, and relentless efforts in making TechByte Summit '26 a remarkable success.",
        "category": "recognition",
    },

    "12-Hour Hackathon": dict(_HACKATHON_CONFIG, id="12-hour-hackathon", name="12-Hour Hackathon"),
}

def resolve_canonical_event_name(name: str) -> str:
    """
    Resolves any event name or supported alias to its canonical event name.
    Raises ValueError with valid events if name is not recognized.
    NEVER defaults or falls back to Paper Presentation!
    """
    if not name or not isinstance(name, str):
        raise ValueError("Event name must be a non-empty string.")
    clean = name.strip()
    if clean in EVENTS_CONFIG:
        return clean
    clean_lower = clean.lower()
    if clean_lower in EVENT_ALIAS_MAP:
        return EVENT_ALIAS_MAP[clean_lower]
    for k in EVENTS_CONFIG:
        if k.lower() == clean_lower:
            return k
    valid_list = list(CANONICAL_EVENTS)
    raise ValueError(
        f"Unknown or unmapped event '{name}'. Valid events are: {', '.join(valid_list)}"
    )

def get_event_by_name(name: str) -> Dict[str, Any] | None:
    try:
        canonical = resolve_canonical_event_name(name)
        return EVENTS_CONFIG.get(canonical) or EVENTS_CONFIG.get(name)
    except ValueError:
        return None

def get_all_events() -> List[Dict[str, Any]]:
    # Return canonical 7 participation events + Certificate of Recognition
    all_keys = list(CANONICAL_EVENTS)
    if "Certificate of Recognition" in EVENTS_CONFIG and "Certificate of Recognition" not in all_keys:
        all_keys.append("Certificate of Recognition")
    return [EVENTS_CONFIG[ev] for ev in all_keys if ev in EVENTS_CONFIG]

def get_template_filename_for_event(event_name: str) -> str:
    if event_name in EVENT_TEMPLATE_MAP:
        return EVENT_TEMPLATE_MAP[event_name]
    for k, v in EVENT_TEMPLATE_MAP.items():
        if k.lower() == event_name.lower():
            return v
    # Check alias map
    clean_lower = event_name.strip().lower()
    if clean_lower in EVENT_ALIAS_MAP:
        canonical = EVENT_ALIAS_MAP[clean_lower]
        if canonical in EVENT_TEMPLATE_MAP:
            return EVENT_TEMPLATE_MAP[canonical]
    raise ValueError(
        f"No certificate template mapped for event '{event_name}'. "
        f"Available events: {', '.join(CANONICAL_EVENTS)}"
    )

def get_template_path_for_event(event_name: str) -> Path:
    filename = get_template_filename_for_event(event_name)
    path = TEMPLATES_DIR / filename
    if not path.exists():
        # Fallback for recognition variants
        if "recognition" in event_name.lower():
            for alt_name in ["Certificate_of_recognition.png", "Certificate_of_recognition (1).png", "Certificate_of_recognition (2).png"]:
                alt_path = TEMPLATES_DIR / alt_name
                if alt_path.exists():
                    return alt_path
        raise FileNotFoundError(
            f"Certificate template file '{filename}' for event '{event_name}' not found in {TEMPLATES_DIR}"
        )
    return path

def validate_template_file(template_path: Path) -> None:
    if not template_path.exists():
        raise FileNotFoundError(f"Certificate template file '{template_path.name}' is missing at {template_path}")
    try:
        with Image.open(template_path) as img:
            if img.size != (CANVAS_WIDTH, CANVAS_HEIGHT):
                raise ValueError(
                    f"Invalid template dimensions for '{template_path.name}': {img.size[0]}x{img.size[1]}px. "
                    f"Expected exactly {CANVAS_WIDTH}x{CANVAS_HEIGHT}px."
                )
    except (FileNotFoundError, ValueError):
        raise
    except Exception as e:
        raise ValueError(f"Template image '{template_path.name}' is corrupted or unreadable: {str(e)}")

def validate_all_templates() -> Dict[str, Path]:
    """
    Validate that every mapped template PNG exists and has exact 2000x1414 dimensions.
    Returns mapping of event name -> Path.
    """
    validated: Dict[str, Path] = {}
    for event_name, filename in EVENT_TEMPLATE_MAP.items():
        path = TEMPLATES_DIR / filename
        validate_template_file(path)
        validated[event_name] = path
    return validated
