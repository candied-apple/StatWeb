import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class DescriptivesRequest(BaseModel):
    dataset_id: uuid.UUID
    variable_names: List[str] = Field(..., min_length=1)
    statistics: Optional[List[str]] = None  # mean, std, median, quartiles, etc.
    missing_strategy: str = "exclude_user_missing"  # exclude_user_missing, include_all


class AnalysisRunResponse(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    analysis_type: str
    name: str
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
