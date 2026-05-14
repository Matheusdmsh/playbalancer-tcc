from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, time


class SkillHistoryEntry(BaseModel):
    booking_id: str
    previous_skill_level: Optional[float] = None
    new_skill_level: float
    source: Optional[Literal["vote", "rating", "manual"]] = None
    changed_at: datetime
    sample_size: Optional[int] = None

class Player(BaseModel):
    id: str
    skill_level: Optional[float] = None
    skill_history: Optional[List[SkillHistoryEntry]] = Field(default_factory=list)


class GroupBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    photo_url: Optional[str] = Field(None, description="URL da foto do grupo")
    members: Optional[List[Player]] = Field(default_factory=list, description="Lista de membros do grupo com id e skill_level")
    admins: Optional[List[str]] = Field(default_factory=list, description="Lista de IDs de administradores do grupo")
    modality: Optional[str] = Field(None, description="Modalidade do grupo (ex: futebol, vôlei, etc.)")
    arena: Optional[str] = Field(None, description="ID da arena/quadra onde o grupo joga")
    max_players: Optional[int] = Field(None, description="Quantidade máxima de jogadores")
    price: Optional[float] = Field(None, description="Valor por pessoa")
    price_type: Optional[Literal["per_person", "total_split"]] = Field(None, description="Tipo de preço: por pessoa ou total dividido")
    recurrence: Optional[List[Literal["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]]] = Field(default_factory=list, description="Dias da semana de recorrência")
    start_time: Optional[str] = Field(None, description="Horário de início (ex: 19:00:00)")
    duration: Optional[int] = Field(None, description="Duração em minutos")
    rating_permission: Optional[str] = Field(None, description="Permissão de avaliação: 'confirmed_only' ou 'confirmed_and_admins'")


class GroupCreate(GroupBase):
    # No caso da criação, o owner_id será obtido do token JWT
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    photo_url: Optional[str] = Field(None, description="URL da foto do grupo")
    members: Optional[List[Player]] = None
    admins: Optional[List[str]] = None
    modality: Optional[str] = Field(None, description="Modalidade do grupo (ex: futebol, vôlei, etc.)")
    arena: Optional[str] = Field(None, description="Arena/quadra onde o grupo joga")
    max_players: Optional[int] = Field(None, description="Quantidade máxima de jogadores")
    price: Optional[float] = Field(None, description="Valor por pessoa")
    price_type: Optional[Literal["per_person", "total_split"]] = Field(None, description="Tipo de preço: por pessoa ou total dividido")
    recurrence: Optional[List[Literal["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]]] = None
    start_time: Optional[str] = Field(None, description="Horário de início (ex: 19:00:00)")
    duration: Optional[int] = Field(None, description="Duração em minutos")
    invite_token: Optional[str] = None
    rating_permission: Optional[str] = Field(None, description="Permissão de avaliação: 'confirmed_only' ou 'confirmed_and_admins'")

class GroupInDB(GroupBase):
    id: str = Field(..., alias="_id")
    owner_id: str
    created_at: datetime
    updated_at: datetime
    invite_token: Optional[str] = None # Adicionado

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}