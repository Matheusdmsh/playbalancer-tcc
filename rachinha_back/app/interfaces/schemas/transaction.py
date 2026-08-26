from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
from typing import Optional, Literal


class TransactionCreate(BaseModel):
    group_id: str
    user_id: str  # User who initiated/recorded the transaction
    type: Literal["expense", "revenue"]
    amount: float
    description: Optional[str] = None

class TransactionUpdate(BaseModel):
    type: Optional[Literal["expense", "revenue"]] = None
    amount: Optional[float] = None
    description: Optional[str] = None

class TransactionInDB(TransactionCreate):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=datetime.now(timezone.utc))
