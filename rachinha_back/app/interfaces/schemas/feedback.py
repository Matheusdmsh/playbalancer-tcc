from pydantic import BaseModel, Field

class Feedback(BaseModel):
    title: str = Field(..., description="Título do feedback")
    description: str = Field(..., description="Descrição do feedback")
    type: str = Field(..., description="Tipo de feedback", enum=["suggestion", "bug", "other"])
