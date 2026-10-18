from typing import Dict, Any, Optional
from app.models.schemas import ValidationSummary, Participant, DeliveryReport

_SESSIONS: Dict[str, Dict[str, Any]] = {}

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return _SESSIONS.get(session_id)

def create_or_update_session(session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    if session_id not in _SESSIONS:
        _SESSIONS[session_id] = {}
    _SESSIONS[session_id].update(data)
    return _SESSIONS[session_id]

def set_participants(session_id: str, participants: list[Participant]):
    sess = get_session(session_id)
    if sess is not None:
        sess["participants"] = {p.id: p for p in participants}

def get_participant(session_id: str, participant_id: str) -> Optional[Participant]:
    sess = get_session(session_id)
    if sess and "participants" in sess:
        return sess["participants"].get(participant_id)
    return None
