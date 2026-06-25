"""
EcoFix AI - Main Application Entry Point
========================================
This file defines the FastAPI application and all of its routes. It acts as the core
backend controller, connecting the mobile app requests to Firebase (for data persistence)
and the Gemini AI Helper (for intelligence and multimodal processing).

Key Responsibilities:
- Receives intake and reporting requests from the mobile app.
- Coordinates AI analysis via `AIHelper`.
- Manages Firebase operations (CRUD for projects, tasks, and profiles).
- Handles gamification logic (points, votes, and verification thresholds).
"""

import os
import uuid
import math
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from models import (
    ReportUploadRequest,
    ReportUploadResponse,
    ProjectResponse,
    TaskResponse,
    PledgeRequest,
    BackRequest,
    VerifyCloseRequest,
    VoteVerificationRequest,
    BespokeRoadmapResponse,
    CommentRequest,
    CommentResponse,
    ChatRequest,
    ChatResponse,
    EcoScanRequest,
    EcoScanResponse,
    Challenge,
    Badge,
    WeeklyReportResponse
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
# Firebase Initialization & Seeding
# -------------------------------------------------------------

# Initialize Firebase
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def seed_database_if_empty():
    """Seeds Firestore with dummy data if the database is empty."""
    projects_ref = db.collection('projects')
    if len(list(projects_ref.limit(1).stream())) > 0:
        return # Already seeded
        
    logger.info("Seeding Firestore with dummy data...")
    
    # Profiles
    profiles = {
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
    for pid, pdata in profiles.items():
        db.collection('profiles').document(pid).set(pdata)
        
    # Projects
    now = datetime.now()
    projects = {
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
            "created_at": now,
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
            "created_at": now,
            "completed_at": None
        }
    }
    for pid, pdata in projects.items():
        db.collection('projects').document(pid).set(pdata)
        
    # Tasks
    tasks = {
        "task-1": {
            "id": "task-1",
            "project_id": "proj-1",
            "title": "Coordinate safety waders & trash grabs",
            "description": "Coordinate retrieval of safety boots and trash grabbers for steep river bank cleanups.",
            "role_required": "Supply Coordinator",
            "assigned_to": "user-2",
            "assigned_name": "Marcus Chen",
            "status": "pledged",
            "created_at": now
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
            "created_at": now
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
            "created_at": now
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
            "created_at": now
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
            "created_at": now
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
            "created_at": now
        }
    }
    for tid, tdata in tasks.items():
        db.collection('tasks').document(tid).set(tdata)

    challenges_ref = db.collection('challenges')
    if len(list(challenges_ref.limit(1).stream())) == 0:
        logger.info("Seeding challenges...")
        challenges = {
            "chal-1": {
                "id": "chal-1",
                "title": "Plastic-Free Week",
                "description": "Scan zero single-use plastics for 7 days in a row.",
                "target_points": 500,
                "current_participants": 124,
                "reward_badge_id": "badge-plastic",
                "status": "active"
            },
            "chal-2": {
                "id": "chal-2",
                "title": "Civic Hero Weekend",
                "description": "Participate or pledge to 3 micro-tasks this weekend.",
                "target_points": 1000,
                "current_participants": 89,
                "reward_badge_id": "badge-civic",
                "status": "active"
            }
        }
        for cid, cdata in challenges.items():
            db.collection('challenges').document(cid).set(cdata)
            
    logger.info("Database seeding check complete.")

# Run seeding on startup
seed_database_if_empty()

# Helper function to compute distance
def compute_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
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
    logger.info(f"Ingesting report at coordinates ({request.latitude}, {request.longitude})")
    
    # 1. Check for duplicates
    projects_ref = db.collection('projects').where('status', '==', 'active').stream()
    for doc in projects_ref:
        project = doc.to_dict()
        distance = compute_distance(
            request.latitude, request.longitude,
            project["latitude"], project["longitude"]
        )
        if distance <= 25.0:
            logger.info(f"Duplicate found: Close to existing project '{project['title']}' ({distance:.1f}m away)")
            return ReportUploadResponse(
                report_id=str(uuid.uuid4()),
                duplicate_found=True,
                duplicate_project_id=project["id"],
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

    if not ai_analysis.get("is_valid_issue", True):
        logger.info("AI determined this is not a valid environmental issue.")
        return ReportUploadResponse(
            report_id="",
            duplicate_found=False,
            duplicate_project_id=None,
            status="invalid",
            hazard_level="none",
            volume_estimate="",
            safety_flags=[],
            municipal_escalation=False,
            message="No valid environmental hazard detected."
        )

    report_id = f"rep-{uuid.uuid4().hex[:6]}"
    
    # Write report
    new_report = {
        "id": report_id,
        "image_url": request.image_url,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "timestamp": request.timestamp,
        "status": "bypassed" if ai_analysis["municipal_escalation"] else "approved",
        "hazard_notes": ai_analysis["reasoning"]
    }
    db.collection('reports').document(report_id).set(new_report)

    # 3. Process Escalation
    if ai_analysis["municipal_escalation"]:
        esc_id = f"esc-{uuid.uuid4().hex[:6]}"
        db.collection('municipal_escalations').document(esc_id).set({
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

    # 4. Normal Civic Action
    proj_id = f"proj-{uuid.uuid4().hex[:6]}"
    title_suffix = "Dump" if "sharp_objects" in ai_analysis["safety_flags"] else "Debris cleanup"
    project_title = f"Civic Action Site #{proj_id[-3:]} ({title_suffix})"
    
    roadmap = AIHelper.generate_roadmap(
        project_title,
        ai_analysis["volumetric_estimate"],
        ai_analysis["safety_flags"]
    )
    
    db.collection('projects').document(proj_id).set({
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
    })

    for i, t in enumerate(roadmap.tasks):
        task_id = f"task-{uuid.uuid4().hex[:6]}"
        db.collection('tasks').document(task_id).set({
            "id": task_id,
            "project_id": proj_id,
            "title": t.title,
            "description": t.description,
            "role_required": t.role_required,
            "assigned_to": None,
            "assigned_name": None,
            "status": "open",
            "created_at": datetime.now()
        })

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
    projects_ref = db.collection('projects')
    if status:
        projects_ref = projects_ref.where('status', '==', status)
    
    return [ProjectResponse(**doc.to_dict()) for doc in projects_ref.stream()]

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    doc = db.collection('projects').document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**doc.to_dict())

@app.get("/api/projects/{project_id}/tasks", response_model=List[TaskResponse])
def get_project_tasks(project_id: str):
    tasks_ref = db.collection('tasks').where('project_id', '==', project_id).stream()
    return [TaskResponse(**doc.to_dict()) for doc in tasks_ref]

@app.post("/api/tasks/{task_id}/pledge", response_model=TaskResponse)
def pledge_task(task_id: str, request: PledgeRequest):
    task_ref = db.collection('tasks').document(task_id)
    doc = task_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task = doc.to_dict()
    if task["status"] != "open":
        raise HTTPException(status_code=400, detail="Task is already pledged or completed")
        
    task["assigned_to"] = request.profile_id
    task["assigned_name"] = request.volunteer_name
    task["status"] = "pledged"
    
    task_ref.set(task)
    return TaskResponse(**task)

@app.post("/api/projects/{project_id}/back", response_model=ProjectResponse)
def back_project(project_id: str, request: BackRequest):
    proj_ref = db.collection('projects').document(project_id)
    doc = proj_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = doc.to_dict()
    proj["current_funds"] = min(proj["estimated_cost"], proj["current_funds"] + request.amount)
    proj_ref.set(proj)
    return ProjectResponse(**proj)

@app.post("/api/projects/{project_id}/verify", response_model=ProjectResponse)
def verify_and_close_project(project_id: str, request: VerifyCloseRequest):
    proj_ref = db.collection('projects').document(project_id)
    doc = proj_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = doc.to_dict()
    if proj["status"] != "active":
        raise HTTPException(status_code=400, detail="Project is not active")
        
    proj["status"] = "pending_verification"
    proj["after_image_url"] = request.after_image_url
    proj["verification_votes_yes"] = 0
    proj["verification_votes_no"] = 0
    proj_ref.set(proj)

    return ProjectResponse(**proj)

@app.post("/api/projects/{project_id}/verification-vote", response_model=ProjectResponse)
def verification_vote(project_id: str, request: VoteVerificationRequest):
    proj_ref = db.collection('projects').document(project_id)
    doc = proj_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = doc.to_dict()
    if proj["status"] != "pending_verification":
        raise HTTPException(status_code=400, detail="Project is not pending verification")

    if request.vote:
        proj["verification_votes_yes"] = proj.get("verification_votes_yes", 0) + 1
    else:
        proj["verification_votes_no"] = proj.get("verification_votes_no", 0) + 1

    # Check thresholds
    if proj["verification_votes_yes"] >= 3:
        proj["status"] = "completed"
        proj["completed_at"] = datetime.now()
        
        # Award XP and complete tasks
        tasks_ref = db.collection('tasks').where('project_id', '==', project_id).stream()
        for task_doc in tasks_ref:
            task = task_doc.to_dict()
            task["status"] = "completed"
            db.collection('tasks').document(task_doc.id).set(task)
            
            assigned_id = task.get("assigned_to")
            if assigned_id:
                prof_ref = db.collection('profiles').document(assigned_id)
                prof_doc = prof_ref.get()
                if prof_doc.exists:
                    prof = prof_doc.to_dict()
                    prof["points"] = prof.get("points", 0) + 100
                    prof_ref.set(prof)
                    
        # Give reporter points. (Assuming the original poster gets points if we had reporter tracking on project)
        # For this prototype we will just use current user logic or assume everyone who participated gets points.
        
    elif proj["verification_votes_no"] >= 3:
        # Revert project back to active
        proj["status"] = "active"
        proj["after_image_url"] = None
        proj["verification_votes_yes"] = 0
        proj["verification_votes_no"] = 0

    proj_ref.set(proj)
    return ProjectResponse(**proj)

@app.get("/api/municipal/escalations")
def get_escalations():
    docs = db.collection('municipal_escalations').stream()
    return [doc.to_dict() for doc in docs]

@app.get("/api/profiles/{profile_id}")
def get_profile(profile_id: str):
    doc = db.collection('profiles').document(profile_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")
    return doc.to_dict()

@app.get("/api/projects/{project_id}/comments", response_model=List[CommentResponse])
def get_comments(project_id: str):
    docs = db.collection('comments').where('project_id', '==', project_id).stream()
    # Sort by created_at client side or use Firestore orderBy
    comments = [doc.to_dict() for doc in docs]
    comments.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    return [CommentResponse(**c) for c in comments]

@app.post("/api/projects/{project_id}/comments", response_model=CommentResponse)
def post_comment(project_id: str, request: CommentRequest):
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
    db.collection('comments').document(comment_id).set(new_comment)
    return CommentResponse(**new_comment)

@app.post("/api/projects/{project_id}/upvote", response_model=ProjectResponse)
def upvote_project(project_id: str):
    proj_ref = db.collection('projects').document(project_id)
    doc = proj_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj = doc.to_dict()
    proj["upvotes"] += 1
    proj_ref.set(proj)
    return ProjectResponse(**proj)

@app.post("/api/chat", response_model=ChatResponse)
def chat_assistant(request: ChatRequest):
    reply = AIHelper.chat_with_assistant(request.message)
    return ChatResponse(reply=reply)

@app.post("/api/eco-scan", response_model=EcoScanResponse)
def eco_scan(request: EcoScanRequest):
    logger.info(f"Eco-Scanning mode: {request.scan_mode}")
    
    ai_analysis = AIHelper.analyze_eco_scan(
        request.scan_mode, request.image_base64
    )

    scan_id = f"scan-{uuid.uuid4().hex[:6]}"
    
    response_data = {
        "scan_id": scan_id,
        "scan_mode": request.scan_mode,
        "sustainability_score": ai_analysis.get("sustainability_score", 0),
        "environmental_impact": ai_analysis.get("environmental_impact", "Analysis failed."),
        "greener_alternatives": ai_analysis.get("greener_alternatives", []),
        "timestamp": datetime.now().isoformat(),
        "user_id": "user-1"
    }
    
    db.collection('eco_scans').document(scan_id).set(response_data)
    return EcoScanResponse(**response_data)

@app.get("/api/my-scans", response_model=List[EcoScanResponse])
def get_my_scans():
    docs = db.collection('eco_scans').where('user_id', '==', 'user-1').stream()
    scans = [doc.to_dict() for doc in docs]
    scans.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return [EcoScanResponse(**s) for s in scans]

# -------------------------------------------------------------
# Gamification & AI Reports Endpoints
# -------------------------------------------------------------

@app.get("/api/challenges", response_model=List[Challenge])
def get_challenges():
    docs = db.collection('challenges').where('status', '==', 'active').stream()
    return [Challenge(**doc.to_dict()) for doc in docs]

@app.post("/api/challenges/{challenge_id}/join", response_model=Challenge)
def join_challenge(challenge_id: str):
    chal_ref = db.collection('challenges').document(challenge_id)
    doc = chal_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    chal = doc.to_dict()
    chal["current_participants"] += 1
    chal_ref.set(chal)
    return Challenge(**chal)

@app.get("/api/profiles/{profile_id}/weekly-report", response_model=WeeklyReportResponse)
def get_weekly_report(profile_id: str):
    # Fetch recent scans
    docs = db.collection('eco_scans').where('user_id', '==', profile_id).stream()
    scans = [doc.to_dict() for doc in docs]
    
    # Sort scans by timestamp descending (newest first)
    scans.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    # Generate the report via Gemini AI
    report_md = AIHelper.generate_weekly_report(scans[:10]) # Send up to 10 recent scans
    
    return WeeklyReportResponse(
        report_markdown=report_md,
        generated_at=datetime.now().isoformat()
    )
