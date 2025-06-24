from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MarkerBase(BaseModel):
    timestamp: float
    label: str
    description: Optional[str] = None
    category: Optional[str] = "general"
    color: Optional[str] = "#f59e0b"


class MarkerCreate(MarkerBase):
    recitation_id: int


class MarkerUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None


class MarkerInDB(MarkerBase):
    id: int
    recitation_id: int
    scholar_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Marker(MarkerInDB):
    pass


# Loop Region Schemas
class LoopRegionBase(BaseModel):
    start_time: float
    end_time: float
    label: str
    color: Optional[str] = "#10b981"


class LoopRegionCreate(LoopRegionBase):
    recitation_id: int


class LoopRegionUpdate(BaseModel):
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    label: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class LoopRegionInDB(LoopRegionBase):
    id: int
    recitation_id: int
    scholar_id: int
    is_active: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoopRegion(LoopRegionInDB):
    pass
