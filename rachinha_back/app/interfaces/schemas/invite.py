from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, Literal

class InviteCreate(BaseModel):
    booking_id: str
    user_id: str
    status: Literal['pending', 'accepted', 'declined'] = 'pending'

class InviteInDB(InviteCreate):
    id: Optional[str] = Field(alias='_id')
    sent_at: datetime = Field(default_factory=datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }