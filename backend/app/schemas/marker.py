from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MarkerBase(BaseModel):
    timestamp: float
    label: str
    description: Optional[str] = None

class MarkerCreate(MarkerBase):
    recitation_id: int

class MarkerUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None

class MarkerInDB(MarkerBase):
    id: int
    recitation_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Marker(MarkerInDB):
    pass
