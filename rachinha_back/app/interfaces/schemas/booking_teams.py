from pydantic import BaseModel, Field
from typing import List, Optional

class BookingTeamStructure(BaseModel):
    """Define a estrutura interna dos times e reservas (apenas IDs)."""
    teams: List[List[str]] = Field(..., description="Lista de times, onde cada time é uma lista de IDs de usuários")
    reserves: List[str] = Field(default_factory=list, description="Lista de IDs dos usuários na reserva")
    team_skills_sum: Optional[List[float]] = Field(None, description="Soma das habilidades de cada time (opcional)")

class BookingTeamsUpdate(BaseModel):
    """Schema para o body da requisição de salvar times."""
    organized_teams: BookingTeamStructure