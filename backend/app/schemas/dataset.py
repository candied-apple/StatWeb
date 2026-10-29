import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.variable import VariableResponse


class DatasetBase(BaseModel):
    name: str = Field(..., max_length=255)


class DatasetCreate(DatasetBase):
    project_id: uuid.UUID


class DatasetResponse(DatasetBase):
    id: uuid.UUID
    project_id: uuid.UUID
    original_filename: str
    file_format: str
    row_count: int
    column_count: int
    file_size_bytes: int
    created_at: datetime
    updated_at: datetime
    variables: Optional[List[VariableResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class DatasetDataPageResponse(BaseModel):
    dataset_id: uuid.UUID
    total_rows: int
    offset: int
    limit: int
    columns: List[str]
    rows: List[Dict[str, Any]]


class CellUpdateItem(BaseModel):
    row_index: int = Field(..., ge=0, description="0-indexed row index in dataset")
    column_name: str = Field(..., min_length=1)
    value: Any = None


class CellBatchUpdateRequest(BaseModel):
    updates: List[CellUpdateItem] = Field(..., min_length=1)


class AddRowRequest(BaseModel):
    values: Optional[Dict[str, Any]] = None


class AddVariableRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    data_type: str = Field("numeric", pattern="^(numeric|string|date|boolean)$")
    label: Optional[str] = None
    measurement_level: str = Field("scale", pattern="^(scale|nominal|ordinal)$")
    decimals: int = Field(2, ge=0, le=16)


class ComputeVariableRequest(BaseModel):
    target_variable: str = Field(..., min_length=1, max_length=64)
    expression: str = Field(..., min_length=1)
    label: Optional[str] = None


class RecodeRule(BaseModel):
    old_value: Optional[Any] = None
    new_value: Any
    is_range: bool = False
    range_min: Optional[float] = None
    range_max: Optional[float] = None
    is_else: bool = False


class RecodeVariableRequest(BaseModel):
    source_variable: str = Field(..., min_length=1)
    target_variable: str = Field(..., min_length=1)
    rules: List[RecodeRule] = Field(..., min_length=1)
    label: Optional[str] = None
