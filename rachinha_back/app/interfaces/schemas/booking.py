from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional, List

from app.interfaces.schemas.arena import Location
from app.interfaces.schemas.group import Player

class BookingCreate(BaseModel):
    court_id: str
    start_time: datetime
    end_time: datetime
    modality: str
    max_players: int = 0
    players: Optional[List[Player]] = None
    reserve_players: Optional[List[Player]] = None
    associated_group_id: Optional[str] = None 
    location: Optional[Location] = None
    status_list: bool = False
    price: Optional[float] = None
    price_type: Optional[Literal["per_person", "total_split"]] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    modality: Optional[str] = None
    max_players: Optional[int] = None
    players: Optional[List[Player]] = None
    reserve_players: Optional[List[Player]] = None
    associated_group_id: Optional[str] = None 
    location: Optional[Location] = None
    status_list: Optional[bool] = None
    price: Optional[float] = None
    price_type: Optional[Literal["per_person", "total_split"]] = None


class RecurringBookingCreate(BaseModel):
    court_id: str
    start_time: datetime
    end_time: datetime
    recurrence_type: Literal["weekly"]
    occurrences: int
    modality: str
    max_players: int = 0
    players: Optional[List[Player]] = None
    reserve_players: Optional[List[Player]] = None
    owner_id: Optional[str] = None
    associated_group_id: Optional[str] = None
    location: Optional[Location] = None
    status_list: bool = False
    price: Optional[float] = None
    price_type: Optional[Literal["per_person", "total_split"]] = None