from pydantic import BaseModel, EmailStr, Field
from typing import Dict, List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern="^[a-zA-Z0-9_.]*$")
    nickname: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    role: List[str] = Field(default_factory=lambda: ["user"])
    phone_number: Optional[str] = None
    is_placeholder: bool = False
    active_card_template: str = "v4"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    username: str
    nickname: Optional[str] = None
    email: EmailStr
    role: str
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    sport_ratings: Dict[str, float] = Field(default_factory=dict)
    active_card_template: str = "v4"
    created_at: datetime
    updated_at: datetime
    is_active: bool
    is_email_verified: bool
    is_placeholder: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    nickname: Optional[str] = None
    email: Optional[EmailStr] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    active_card_template: Optional[str] = None

class UserInDB(UserCreate):
    password: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    is_email_verified: bool = False
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    sport_ratings: Dict[str, float] = Field(default_factory=dict)
    is_placeholder: bool = False
    active_card_template: str = "v4"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

class UserSearchResult(BaseModel):
    id: str = Field(alias="_id")
    name: str
    username: str
    nickname: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        populate_by_name = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)
    confirm_new_password: str = Field(min_length=6)

    @classmethod
    def validate(cls, values):
        if values.get('new_password') != values.get('confirm_new_password'):
            raise ValueError("New password and confirmation do not match")
        return values


class FCMTokenRequest(BaseModel):
    fcm_token: str

class UserGhostUpdate(BaseModel):
    email: EmailStr