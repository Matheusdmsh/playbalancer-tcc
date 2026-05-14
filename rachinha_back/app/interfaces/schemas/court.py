from pydantic import BaseModel
from typing import List, Optional
from datetime import time

class AvailableHour(BaseModel):
    day_of_week: str  
    start_time: time  
    end_time: time    
    
class CourtCreate(BaseModel):
    name: str
    sports_supported: List[str]
    value_per_hour: float
    value_per_half_hour: Optional[float] = None
    description: str
    photos_url: List[str]
    characteristics: List[str]
    capacity: Optional[int] = None 
    is_active: bool = True
    belong_arena: str
    available_hours: List[AvailableHour]

class CourtUpdate(BaseModel):
    name: Optional[str] = None
    sports_supported: Optional[List[str]] = None
    belong_arena: Optional[str] = None
    value_per_hour: Optional[float] = None
    value_per_half_hour: Optional[float] = None
    description: Optional[str] = None
    photos_url: Optional[List[str]] = None
    characteristics: Optional[List[str]] = None
    capacity: Optional[int] = None 
    is_active: Optional[bool] = True
    available_hours: Optional[List[AvailableHour]] = None