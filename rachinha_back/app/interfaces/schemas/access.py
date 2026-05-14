from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AccessLog(BaseModel):
    user_id: str
    email: str
    username: str
    login_time: datetime
    token_expiration: datetime
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    method: str = "login_password"
    success: bool = True
