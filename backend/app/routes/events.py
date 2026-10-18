from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.config.events import get_all_events, get_event_by_name

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=List[Dict[str, Any]])
def list_events():
    """Return all configured TechByte Summit '26 events."""
    return get_all_events()

@router.get("/{event_name}", response_model=Dict[str, Any])
def get_event(event_name: str):
    """Return details for a specific event."""
    event = get_event_by_name(event_name)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_name}' not found")
    return event
