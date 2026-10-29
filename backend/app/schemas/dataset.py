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
