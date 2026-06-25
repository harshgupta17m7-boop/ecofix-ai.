"""
EcoFix AI - Backend Models
==========================
This file defines all Pydantic models used by the FastAPI backend for request validation
and response formatting. Pydantic ensures that data sent from the mobile app is correctly
typed and structured before it reaches the core business logic.

Usage:
    Import these classes in `main.py` and `ai_helper.py` to type-hint route parameters
    and enforce API schema definitions.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 1. Intake & Multimodal Ingestion Models
class ReportUploadRequest(BaseModel):
    """
    Schema for uploading a new civic hazard report.
    This represents the JSON body sent from the EcoFix mobile app's CameraScreen.
    """
    image_url: str = Field(..., description="URL of the uploaded degradation photo")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data if available")
    latitude: float = Field(..., description="GPS Latitude coordinate")
    longitude: float = Field(..., description="GPS Longitude coordinate")
    timestamp: str = Field(..., description="Timestamp from EXIF metadata")
    address: Optional[str] = Field(None, description="Street address or landmark")
    scan_mode: Optional[str] = Field("civic", description="Type of scan: civic, bill, or product")

class EcoScanRequest(BaseModel):
    """
    Schema for evaluating a product or utility bill for its sustainability impact.
    Sent by the EcoScannerScreen in the mobile app.
    """
    image_url: str
    image_base64: Optional[str] = None
    scan_mode: str

class EcoScanResponse(BaseModel):
    """
    Schema representing the AI-generated sustainability analysis for a product or bill.
    Returned to the mobile app to display sustainability scores and greener alternatives.
    """
    scan_id: str
    scan_mode: str
    sustainability_score: int
    environmental_impact: str
    greener_alternatives: List[str]
    timestamp: str

class ReportUploadResponse(BaseModel):
    """
    Schema returned after successfully reporting a civic hazard.
    Contains the AI's hazard analysis, volumetric estimates, and confirmation of project creation.
    """
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
    """
    Schema representing a Civic Cleanup Project in the community feed and project details.
    Tracks location, funding, completion status, community votes, and images.
    """
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
    verification_votes_yes: int = 0
    verification_votes_no: int = 0
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
# 4. Verification & Guardrails Models
class VerifyCloseRequest(BaseModel):
    """
    Schema for initiating the verification process when a user claims to have cleaned an area.
    Contains the 'After' photo URL.
    """
    after_image_url: str
    reporter_id: str

class VoteVerificationRequest(BaseModel):
    """
    Schema for casting a community vote on whether a pending project is truly completed based on the After-Photo.
    """
    profile_id: str
    vote: bool  # True for Yes (verified), False for No (rejected)

# 5. Gamification Models
class Badge(BaseModel):
    id: str
    title: str
    icon_name: str
    description: str
    earned_at: datetime

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    target_points: int
    current_participants: int
    reward_badge_id: str
    status: str

class WeeklyReportResponse(BaseModel):
    report_markdown: str
    generated_at: str
