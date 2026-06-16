from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class RemarkActionResponse(BaseModel):
    """Response after performing an action on a remark."""
    model_config = ConfigDict(from_attributes=True)
    success: bool
    action: str
    remark_id: str
    new_status: str
    workflow_instance_id: Optional[int] = None

class RemarkWorkflowStartResponse(BaseModel):
    """Response after starting a workflow for a remark."""
    model_config = ConfigDict(from_attributes=True)
    success: bool
    remark_id: str
    workflow_instance_id: Optional[int] = None

class RemarkLinkResponse(BaseModel):
    """Response after linking two remarks."""
    model_config = ConfigDict(from_attributes=True)
    success: bool
    remark_id: str
    related_id: str
    message: str
