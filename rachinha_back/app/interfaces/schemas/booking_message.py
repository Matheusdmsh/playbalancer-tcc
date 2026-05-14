# app/interfaces/schemas/message.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from bson import ObjectId 
class BookingMessageCreate(BaseModel):
    content: str
    booking_id: str
    sender_id: str

class BookingMessageInDB(BookingMessageCreate):
    id: Optional[str] = Field(alias="_id")
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(), 
            ObjectId: str 
        }