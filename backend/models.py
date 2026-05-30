from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 1. Intake & Multimodal Ingestion Models
class ReportUploadRequest(BaseModel):
    image_url: str = Field(..., description="URL of the uploaded degradation photo")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data if available")
    latitude: float = Field(..., description="GPS Latitude coordinate")
    longitude: float = Field(..., description="GPS Longitude coordinate")
    timestamp: str = Field(..., description="Timestamp from EXIF metadata")
    address: Optional[str] = Field(None, description="Street address or landmark")

class ReportUploadResponse(BaseModel):
    report_id: str
    duplicate_found: bool
    duplicate_project_id: Optional[str] = None
    status: str  # 'pending', 'approved', 'rejected', 'bypassed'
    hazard_level: str  # 'low', 'medium', 'high', 'critical'
    volume_estimate: str  # e.g., '3.2 cubic yards'
    safety_flags: List[str]
    municipal_escalation: bool
    message: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# 2. Roadmapping & Project Scoping Models
class MicroTaskSchema(BaseModel):
    title: str
    description: str
    role_required: str # e.g., 'Heavy Lifter', 'Sorter', 'Supply Coordinator'

class BespokeRoadmapResponse(BaseModel):
    project_title: str
    project_description: str
    volumetric_debris: str
    safety_flags: List[str]
    estimated_cost: float
    time_to_completion_hours: int
    feasibility_score: int
    tasks: List[MicroTaskSchema]

# 3. Active Collaboration Models
class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: str
    estimated_cost: float
    current_funds: float
    volumetric_debris: str
    safety_flags: List[str]
    feasibility_score: int
    before_image_url: str
    after_image_url: Optional[str] = None
    upvotes: int = 0
    created_at: datetime
    completed_at: Optional[datetime] = None

class CommentRequest(BaseModel):
    profile_id: str
    author_name: str
    content: str
    photo_url: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    project_id: str
    profile_id: str
    author_name: str
    content: str
    photo_url: Optional[str] = None
    created_at: datetime

class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    role_required: str
    assigned_to: Optional[str] = None
    assigned_name: Optional[str] = None
    status: str
    created_at: datetime

class PledgeRequest(BaseModel):
    profile_id: str
    volunteer_name: str

class BackRequest(BaseModel):
    profile_id: str
    amount: float

# 4. Verification & Guardrails Models
class VerifyCloseRequest(BaseModel):
    after_image_url: str
    reporter_id: str
