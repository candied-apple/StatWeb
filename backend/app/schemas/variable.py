import uuid
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class VariableBase(BaseModel):
    name: str = Field(..., max_length=128)
    column_index: int
    label: Optional[str] = None
    data_type: str = "numeric"  # numeric, string, date, boolean
    measurement_level: str = "scale"  # nominal, ordinal, scale
    role: str = "input"
    missing_values: Optional[List[Any]] = None
    value_labels: Optional[Dict[str, str]] = None
    display_width: int = 8
    decimals: int = 2


class VariableUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None
    data_type: Optional[str] = None
    measurement_level: Optional[str] = None
    role: Optional[str] = None
    missing_values: Optional[List[Any]] = None
    value_labels: Optional[Dict[str, str]] = None
    display_width: Optional[int] = None
    decimals: Optional[int] = None


class VariableResponse(VariableBase):
    id: uuid.UUID
    dataset_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
