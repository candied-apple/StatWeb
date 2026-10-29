import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class DescriptivesRequest(BaseModel):
    dataset_id: uuid.UUID
    variable_names: List[str] = Field(..., min_length=1)
    statistics: Optional[List[str]] = None
    missing_strategy: str = "exclude_user_missing"


class FrequenciesRequest(BaseModel):
    dataset_id: uuid.UUID
    variable_names: List[str] = Field(..., min_length=1)


class CrosstabRequest(BaseModel):
    dataset_id: uuid.UUID
    row_variable: str
    column_variable: str


class IndependentTTestRequest(BaseModel):
    dataset_id: uuid.UUID
    test_variable: str
    group_variable: str
    group1_value: Any
    group2_value: Any


class PairedTTestRequest(BaseModel):
    dataset_id: uuid.UUID
    pair1_variable: str
    pair2_variable: str


class AnovaRequest(BaseModel):
    dataset_id: uuid.UUID
    dependent_variable: str
    factor_variable: str


class CorrelationRequest(BaseModel):
    dataset_id: uuid.UUID
    variable_names: List[str] = Field(..., min_length=2)


class RegressionRequest(BaseModel):
    dataset_id: uuid.UUID
    dependent_variable: str
    independent_variables: List[str] = Field(..., min_length=1)


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
