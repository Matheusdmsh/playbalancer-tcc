from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, Literal

NotificationType = Literal[
    "group_invitation", 
    "booking_invitation", 
    "new_group_message", 
    "new_booking_message",
    'booking_removal'
]

class NotificationCreate(BaseModel):
    user_id: str
    notification_type: NotificationType
    message: str
    related_id: str # ID do grupo, booking, etc.
    link: str # Link para o recurso (ex: /groups/{id})

class NotificationInDB(NotificationCreate):
    id: str = Field(alias="_id")
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }