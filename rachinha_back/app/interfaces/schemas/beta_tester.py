from pydantic import BaseModel, EmailStr


class EmailCollectionRequest(BaseModel):
    email: str
    
class EmailOut(BaseModel):
    id: str
    email: EmailStr