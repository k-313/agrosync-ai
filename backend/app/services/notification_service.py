import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import Notification
from app.database import generate_uuid

def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "system",
    metadata: Optional[Dict[str, Any]] = None
) -> Notification:
    notif = Notification(
        id=generate_uuid(),
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
        metadata_json=json.dumps(metadata) if metadata else None
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
