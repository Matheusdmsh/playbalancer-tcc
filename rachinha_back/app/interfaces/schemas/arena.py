from pydantic import BaseModel, Field
from typing import List, Optional

class Location(BaseModel):
    cep: Optional[str] = Field(None, min_length=8, max_length=8, description="CEP of the location")
    street: Optional[str] = Field(None, min_length=3, max_length=100, description="Street name of the location")
    complementary: Optional[str] = Field(None, max_length=100, description="Complementary address information")
    unit: Optional[str] = Field(None, max_length=100, description="Unit information")
    neighborhood: Optional[str] = Field(None, min_length=3, max_length=50, description="Neighborhood of the location")
    city: Optional[str] = Field(None, min_length=3, max_length=50, description="City of the location")
    uf: Optional[str] = Field(None, min_length=2, max_length=2, description="State of the location (2-letter code)")
    state: Optional[str] = Field(None, min_length=3, max_length=50, description="Full name of the state")
    region: Optional[str] = Field(None, max_length=50, description="Region of the location")
    ibge: Optional[str] = Field(None, max_length=50, description="IBGE code of the location")
    gia: Optional[str] = Field(None, max_length=50, description="GIA code of the location")
    ddd: Optional[str] = Field(None, max_length=50, description="DDD code of the location")
    siafi: Optional[str] = Field(None, max_length=50, description="SIAFI code of the location")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude of the location")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude of the location")
    alt: Optional[str] = Field(None, min_length=1, max_length=50, description="Alternative name for the location")

class ArenaCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    is_active: bool
    photos_url: List[str]
    location: Location
    description: Optional[str] = Field(None, max_length=500)

class ArenaUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    is_active: Optional[bool] = None
    photos_url: Optional[List[str]] = None
    location: Optional[Location] = None
    description: Optional[str] = Field(None, max_length=500)