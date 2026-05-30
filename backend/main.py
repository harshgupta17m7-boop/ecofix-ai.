import os
import uuid
import math
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ReportUploadRequest,
    ReportUploadResponse,
    ProjectResponse,
    TaskResponse,
    PledgeRequest,
    BackRequest,
    VerifyCloseRequest,
    BespokeRoadmapResponse,
    CommentRequest,
    CommentResponse,
    ChatRequest,
    ChatResponse
)
from ai_helper import AIHelper

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EcoFixAI-Backend")

app = FastAPI(
    title="EcoFix AI - Civic Action API",
    description="Intelligent ingestion, roadmapping, and coordination backend for local environmental projects.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# In-Memory State Mocking Database
# -------------------------------------------------------------
db_profiles = {
    "user-1": {
        "id": "user-1",
        "full_name": "Elena Rostova",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        "points": 350
    },
    "user-2": {
        "id": "user-2",
        "full_name": "Marcus Chen",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        "points": 180
    }
}

db_reports: List[Dict[str, Any]] = []
db_comments: Dict[str, List[Dict[str, Any]]] = {}

db_projects: Dict[str, Dict[str, Any]] = {
    "proj-1": {
        "id": "proj-1",
        "title": "Riverside Park Garbage Spill",
        "description": "Accumulation of plastics and household waste near the river bank. Volunteers needed to bag and sort waste, and transport it to the local dump.",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "Riverside Park Trail",
        "status": "active",
        "estimated_cost": 65.00,
        "current_funds": 35.00,
        "volumetric_debris": "1.8 cubic yards",
        "safety_flags": ["water_proximity", "slippery_slopes"],
        "feasibility_score": 85,
        "before_image_url": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80",
        "after_image_url": None,
        "upvotes": 12,
        "created_at": datetime.now(),
        "completed_at": None
    },
    "proj-2": {
        "id": "proj-2",
        "title": "Oak Avenue Illegal Dumping Site",
        "description": "Discarded construction materials, tires, and metal scraps blocking the sidewalk and drainage ditch.",
        "latitude": 40.7180,
        "longitude": -74.0090,
        "address": "Oak Ave and 5th St",
        "status": "active",
        "estimated_cost": 85.00,
        "current_funds": 85.00,
        "volumetric_debris": "4.5 cubic yards",
        "safety_flags": ["sharp_objects", "heavy_lifting", "rusted_metal"],
        "feasibility_score": 68,
        "before_image_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
        "after_image_url": None,
        "upvotes": 5,
        "created_at": datetime.now(),
        "completed_at": None
    }
}

db_tasks: Dict[str, Dict[str, Any]] = {
    "task-1": {
        "id": "task-1",
        "project_id": "proj-1",
        "title": "Coordinate safety waders & trash grabs",
        "description": "Coordinate retrieval of safety boots and trash grabbers for steep river bank cleanups.",
        "role_required": "Supply Coordinator",
        "assigned_to": "user-2",
        "assigned_name": "Marcus Chen",
        "status": "pledged",
        "created_at": datetime.now()
    },
    "task-2": {
        "id": "task-2",
        "project_id": "proj-1",
        "title": "Bag Litter Along Riverfront",
        "description": "Sweep and pick up all plastic containers, wraps, and generic waste into bags along the 50m stream segment.",
        "role_required": "Sorter",
        "assigned_to": None,
        "assigned_name": None,
        "status": "open",
        "created_at": datetime.now()
    },
    "task-3": {
        "id": "task-3",
        "project_id": "proj-1",
        "title": "Transport trash bags to dump",
        "description": "Provide a flatbed or vehicle with large trunk to haul bagged waste to city landfill.",
        "role_required": "Transportation",
        "assigned_to": None,
        "assigned_name": None,
        "status": "open",
        "created_at": datetime.now()
    },
    "task-4": {
        "id": "task-4",
        "project_id": "proj-2",
        "title": "Source protective thick-mesh gloves",
        "description": "Acquire 5 pairs of steel-mesh safety gloves to handle rusted rebar and broken scrap elements.",
        "role_required": "Supply Coordinator",
        "assigned_to": "user-1",
        "assigned_name": "Elena Rostova",
        "status": "pledged",
        "created_at": datetime.now()
    },
    "task-5": {
        "id": "task-5",
        "project_id": "proj-2",
        "title": "Sort scrap metal and tires",
        "description": "Sort heavy tires and metal pieces to make loading and dump categorization easier.",
        "role_required": "Sorter",
        "assigned_to": None,
        "assigned_name": None,
        "status": "open",
        "created_at": datetime.now()
    },
    "task-6": {
        "id": "task-6",
        "project_id": "proj-2",
        "title": "Load construction blocks & heavy debris",
        "description": "Physically lift and consolidate concrete blocks and broken pallets into haul location.",
        "role_required": "Heavy Lifter",
        "assigned_to": None,
        "assigned_name": None,
        "status": "open",
        "created_at": datetime.now()
    }
}

db_municipal_escalations: List[Dict[str, Any]] = [
    {
        "id": "esc-1",
        "image_url": "https://images.unsplash.com/photo-1599740831243-d97f3eabc7d3?w=800&auto=format&fit=crop&q=80",
        "latitude": 40.7220,
        "longitude": -74.0150,
        "safety_flags": ["downed_power_lines", "electrocution_hazard"],
        "hazard_level": "critical",
        "reasoning": "High-voltage transmission line snapped and resting on metallic fence in residential alleyway. Citizens rerouted; dispatched to local grid utility and fire safety crew.",
        "escalated_at": datetime.now()
    }
]

# Helper function to compute distance (Haversine formula to simulate PostGIS ST_DWithin)
def compute_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2.0)**2 + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(d_lon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.post("/api/intake", response_model=ReportUploadResponse)
def report_intake(request: ReportUploadRequest):
    """
    Ingests photo reports, detects duplicates within a 25-meter geographical radius,
    analyzes volumetric size & safety hazards, and routes high-risk issues to municipal bypass.
    """
    logger.info(f"Ingesting report at coordinates ({request.latitude}, {request.longitude})")
    
    # 1. PostGIS-equivalent lookup check: Duplicate check within 25-meter radius
    for project_id, project in db_projects.items():
        if project["status"] == "active":
            distance = compute_distance(
                request.latitude, request.longitude,
                project["latitude"], project["longitude"]
            )
            if distance <= 25.0:
                logger.info(f"Duplicate found: Close to existing project '{project['title']}' ({distance:.1f}m away)")
                return ReportUploadResponse(
                    report_id=str(uuid.uuid4()),
                    duplicate_found=True,
                    duplicate_project_id=project_id,
                    status="approved",
                    hazard_level="low",
                    volume_estimate="N/A",
                    safety_flags=[],
                    municipal_escalation=False,
                    message=f"Duplicate reported. Mapped directly to active project: {project['title']}"
                )

    # 2. Call AI vision helper
    ai_analysis = AIHelper.analyze_image_intake(
        request.image_url, request.latitude, request.longitude, request.image_base64
    )

    report_id = f"rep-{uuid.uuid4().hex[:6]}"
    
    # Write report transaction to db
    new_report = {
        "id": report_id,
        "image_url": request.image_url,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "timestamp": request.timestamp,
        "status": "bypassed" if ai_analysis["municipal_escalation"] else "approved",
        "hazard_notes": ai_analysis["reasoning"]
    }
    db_reports.append(new_report)

    # 3. Process Ingestion Routing
    if ai_analysis["municipal_escalation"]:
        # Escalated to Municipality bypassing citizens
        esc_id = f"esc-{uuid.uuid4().hex[:6]}"
        db_municipal_escalations.append({
            "id": esc_id,
            "image_url": request.image_url,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "safety_flags": ai_analysis["safety_flags"],
            "hazard_level": ai_analysis["hazard_level"],
            "reasoning": ai_analysis["reasoning"],
            "escalated_at": datetime.now()
        })
        return ReportUploadResponse(
            report_id=report_id,
            duplicate_found=False,
            status="bypassed",
            hazard_level=ai_analysis["hazard_level"],
            volume_estimate=ai_analysis["volumetric_estimate"],
            safety_flags=ai_analysis["safety_flags"],
            municipal_escalation=True,
            message="Hazardous conditions detected. Incident bypassed automatically to municipal safety dispatch."
        )

    # 4. Normal Actionable Cleanup: Auto-create Active Project and trigger Roadmap Generation
    proj_id = f"proj-{uuid.uuid4().hex[:6]}"
    
    # Infer a generic title based on coordinates / safety tags
    title_suffix = "Dump" if "sharp_objects" in ai_analysis["safety_flags"] else "Debris cleanup"
    project_title = f"Civic Action Site #{proj_id[-3:]} ({title_suffix})"
    
    # Generate Bespoke Roadmap via AI
    roadmap = AIHelper.generate_roadmap(
        project_title,
        ai_analysis["volumetric_estimate"],
        ai_analysis["safety_flags"]
    )
    
    # Insert new project into db
    db_projects[proj_id] = {
        "id": proj_id,
        "title": roadmap.project_title,
        "description": roadmap.project_description,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "address": request.address,
        "status": "active",
        "estimated_cost": roadmap.estimated_cost,
        "current_funds": 0.00,
        "volumetric_debris": roadmap.volumetric_debris,
        "safety_flags": roadmap.safety_flags,
        "feasibility_score": roadmap.feasibility_score,
        "before_image_url": request.image_url,
        "after_image_url": None,
        "upvotes": 0,
        "created_at": datetime.now(),
        "completed_at": None
    }

    # Insert tasks into db
    for i, t in enumerate(roadmap.tasks):
        task_id = f"task-{uuid.uuid4().hex[:6]}"
        db_tasks[task_id] = {
            "id": task_id,
            "project_id": proj_id,
            "title": t.title,
            "description": t.description,
            "role_required": t.role_required,
            "assigned_to": None,
            "assigned_name": None,
            "status": "open",
            "created_at": datetime.now()
        }

    return ReportUploadResponse(
        report_id=report_id,
        duplicate_found=False,
        duplicate_project_id=proj_id,
        status="approved",
        hazard_level=ai_analysis["hazard_level"],
        volume_estimate=ai_analysis["volumetric_estimate"],
        safety_flags=ai_analysis["safety_flags"],
        municipal_escalation=False,
        message="Visual verification approved. Civic project launched with step-by-step roadmap."
    )


@app.get("/api/projects", response_model=List[ProjectResponse])
def get_projects(status: Optional[str] = None):
    """
    Returns lists of all projects, filtering by status.
    """
    projects_list = []
    for p in db_projects.values():
        if not status or p["status"] == status:
            projects_list.append(ProjectResponse(**p))
    return projects_list


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    """
    Returns single project details.
    """
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**db_projects[project_id])


@app.get("/api/projects/{project_id}/tasks", response_model=List[TaskResponse])
def get_project_tasks(project_id: str):
    """
    Returns all micro-tasks mapped to a specific project.
    """
    tasks_list = []
    for t in db_tasks.values():
        if t["project_id"] == project_id:
            tasks_list.append(TaskResponse(**t))
    return tasks_list


@app.post("/api/tasks/{task_id}/pledge", response_model=TaskResponse)
def pledge_task(task_id: str, request: PledgeRequest):
    """
    Assigns a micro-task to a specific user (pledge work or supplies).
    """
    if task_id not in db_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task = db_tasks[task_id]
    if task["status"] != "open":
        raise HTTPException(status_code=400, detail="Task is already pledged or completed")
        
    task["assigned_to"] = request.profile_id
    task["assigned_name"] = request.volunteer_name
    task["status"] = "pledged"
    
    return TaskResponse(**task)


@app.post("/api/projects/{project_id}/back", response_model=ProjectResponse)
def back_project(project_id: str, request: BackRequest):
    """
    Contributes money to a project's tool/disposal crowdfunding ledger.
    """
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = db_projects[project_id]
    proj["current_funds"] = min(proj["estimated_cost"], proj["current_funds"] + request.amount)
    
    return ProjectResponse(**proj)


@app.post("/api/projects/{project_id}/verify", response_model=ProjectResponse)
def verify_and_close_project(project_id: str, request: VerifyCloseRequest):
    """
    Proof-to-Fix verification. Commits 'After' photo matching spatial orientation.
    Closes the project, flags tasks as completed, and awards reward points to the reporter and active volunteers.
    """
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = db_projects[project_id]
    if proj["status"] != "active":
        raise HTTPException(status_code=400, detail="Project is not active")
        
    # In full app, we would perform image similarity structural comparison:
    # comparing request.after_image_url with proj.before_image_url using visual embeddings.
    # Here we mock approval:
    proj["status"] = "completed"
    proj["after_image_url"] = request.after_image_url
    proj["completed_at"] = datetime.now()
    
    # Set all associated tasks as completed
    for t in db_tasks.values():
        if t["project_id"] == project_id:
            t["status"] = "completed"
            
            # Award points to assigned volunteers (simulating DB trigger)
            assigned_id = t["assigned_to"]
            if assigned_id and assigned_id in db_profiles:
                db_profiles[assigned_id]["points"] += 100
                logger.info(f"Awarded 100 points to volunteer {db_profiles[assigned_id]['full_name']}")

    # Award points to the closeout reporter
    if request.reporter_id in db_profiles:
        db_profiles[request.reporter_id]["points"] += 150
        logger.info(f"Awarded 150 points to reporter {db_profiles[request.reporter_id]['full_name']} for closing project")

    return ProjectResponse(**proj)


@app.get("/api/municipal/escalations")
def get_escalations():
    """
    Returns bypassed dangerous hazard reports meant for municipal public works.
    """
    return db_municipal_escalations


@app.get("/api/profiles/{profile_id}")
def get_profile(profile_id: str):
    """
    Gets user profile points and status.
    """
    if profile_id not in db_profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profiles[profile_id]

# -------------------------------------------------------------
# Collaboration & Feedback Endpoints
# -------------------------------------------------------------

@app.get("/api/projects/{project_id}/comments", response_model=List[CommentResponse])
def get_comments(project_id: str):
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_comments.get(project_id, [])

@app.post("/api/projects/{project_id}/comments", response_model=CommentResponse)
def post_comment(project_id: str, request: CommentRequest):
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
        
    comment_id = f"cmd-{uuid.uuid4().hex[:6]}"
    new_comment = {
        "id": comment_id,
        "project_id": project_id,
        "profile_id": request.profile_id,
        "author_name": request.author_name,
        "content": request.content,
        "photo_url": request.photo_url,
        "created_at": datetime.now()
    }
    
    if project_id not in db_comments:
        db_comments[project_id] = []
    db_comments[project_id].append(new_comment)
    
    return CommentResponse(**new_comment)

@app.post("/api/projects/{project_id}/upvote", response_model=ProjectResponse)
def upvote_project(project_id: str):
    if project_id not in db_projects:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_projects[project_id]["upvotes"] += 1
    return ProjectResponse(**db_projects[project_id])

@app.post("/api/chat", response_model=ChatResponse)
def chat_assistant(request: ChatRequest):
    """
    Passes a message to the EcoFix AI Assistant for tips.
    """
    reply = AIHelper.chat_with_assistant(request.message)
    return ChatResponse(reply=reply)
