from pydantic import BaseModel, Field
from typing import Literal

class Feedback(BaseModel):
    title: str = Field(..., description="Título do feedback")
    description: str = Field(..., description="Descrição do feedback")
    type: Literal["suggestion", "bug", "other"] = Field(..., description="Tipo de feedback")
