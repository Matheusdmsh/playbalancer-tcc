from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
from typing import Optional, Literal

class InviteCreate(BaseModel):
    booking_id: str
    user_id: str
    status: Literal['pending', 'accepted', 'declined'] = 'pending'

class InviteInDB(InviteCreate):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(alias='_id')
    sent_at: datetime = Field(default_factory=datetime.now(timezone.utc))
