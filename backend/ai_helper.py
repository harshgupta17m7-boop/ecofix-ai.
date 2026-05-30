import os
import json
import logging
from typing import Dict, Any, List
import requests
from models import BespokeRoadmapResponse, MicroTaskSchema

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EcoFixAI-AIHelper")

# Retrieve Gemini API Key from environment variables (or use injected key)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class AIHelper:
    @staticmethod
    def analyze_image_intake(image_url: str, latitude: float, longitude: float, image_base64: str = None) -> Dict[str, Any]:
        """
        Analyzes the uploaded environmental degradation photo using Gemini Multimodal API.
        Extracts volumetric estimate, flags hazards, and checks for municipal escalation.
        Includes a rich fallback simulator when the API key is not set.
        """
        if not GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not found. Running simulated visual intake pipeline...")
            return AIHelper._simulate_image_intake(image_url)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            
            prompt = f"""
            Analyze the environmental degradation shown in the attached image.
            If no image is attached, rely on this image URL if possible: {image_url}.
            You must calculate spatial density and estimate the volume of material/debris in cubic yards.
            Flag safety parameters such as:
            - Proximity to water sources (e.g. rivers, lakes, drains)
            - Presence of sharp objects (e.g. broken glass, rusted metal)
            - Toxic materials (e.g. batteries, electronics, chemicals)
            - Heavy debris (e.g. concrete blocks, tires)
            Determine if the issue involves highly dangerous components requiring direct municipal escalation (e.g., hazardous waste, structural collapse, downed power lines). If so, set municipal_escalation to true.
            
            Return ONLY a valid JSON object matching this schema:
            {{
                "volumetric_estimate": "string (e.g., '4.5 cubic yards')",
                "safety_flags": ["string"],
                "municipal_escalation": boolean,
                "hazard_level": "string (low, medium, high, critical)",
                "reasoning": "string explaining volume and hazard assessment"
            }}
            """
            
            parts = [{"text": prompt}]
            if image_base64:
                parts.append({
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": image_base64
                    }
                })
            
            payload = {
                "contents": [{
                    "parts": parts
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                result_json = response.json()
                text_response = result_json['candidates'][0]['content']['parts'][0]['text']
                return json.loads(text_response.strip())
            else:
                logger.error(f"Gemini API returned error: {response.text}")
                return AIHelper._simulate_image_intake(image_url)
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return AIHelper._simulate_image_intake(image_url)

    @staticmethod
    def generate_roadmap(title: str, volumetric_debris: str, safety_flags: List[str]) -> BespokeRoadmapResponse:
        """
        Parses the verified issue details using Gemini text-based structure generation
        to construct a step-by-step resolution plan split into operational roles.
        """
        if not GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not found. Running simulated Bespoke Roadmap generator...")
            return AIHelper._simulate_roadmap(title, volumetric_debris, safety_flags)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            
            prompt = f"""
            Generate a bespoke community cleanup roadmap for: "{title}".
            Details:
            - Volumetric Debris: {volumetric_debris}
            - Safety Hazards: {', '.join(safety_flags)}
            
            Generate a step-by-step cleanup roadmap containing specific micro-tasks.
            Each micro-task must fit into one of these volunteer roles:
            - 'Sorter' (picks sorting recyclable vs non-recyclable)
            - 'Heavy Lifter' (manages physical hauling of large items)
            - 'Supply Coordinator' (brings gloves, garbage bags, water, first aid)
            - 'Transportation Provider' (hauls waste to the official dump site)
            
            Also estimate:
            - Material costs (budget for garbage bags, gloves, shovel/rake rentals)
            - Time to completion (hours)
            - Feasibility Score (0-100, where higher is easier and requires fewer heavy resources or hazardous handling).
            
            Return ONLY a valid JSON object matching this schema:
            {{
                "project_title": "{title}",
                "project_description": "General description outlining the plan",
                "volumetric_debris": "{volumetric_debris}",
                "safety_flags": {json.dumps(safety_flags)},
                "estimated_cost": number (e.g. 85.00),
                "time_to_completion_hours": number,
                "feasibility_score": number (0-100),
                "tasks": [
                    {{
                        "title": "task title",
                        "description": "task detail",
                        "role_required": "one of: Sorter, Heavy Lifter, Supply Coordinator, Transportation"
                    }}
                ]
            }}
            """
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                result_json = response.json()
                text_response = result_json['candidates'][0]['content']['parts'][0]['text']
                data = json.loads(text_response.strip())
                
                # Parse tasks to MicroTaskSchema
                tasks = [MicroTaskSchema(**t) for t in data.get("tasks", [])]
                return BespokeRoadmapResponse(
                    project_title=data.get("project_title", title),
                    project_description=data.get("project_description", "Community cleanup initiative."),
                    volumetric_debris=data.get("volumetric_debris", volumetric_debris),
                    safety_flags=data.get("safety_flags", safety_flags),
                    estimated_cost=float(data.get("estimated_cost", 50.0)),
                    time_to_completion_hours=int(data.get("time_to_completion_hours", 3)),
                    feasibility_score=int(data.get("feasibility_score", 80)),
                    tasks=tasks
                )
            else:
                return AIHelper._simulate_roadmap(title, volumetric_debris, safety_flags)
        except Exception as e:
            logger.error(f"Error generating roadmap via Gemini: {str(e)}")
            return AIHelper._simulate_roadmap(title, volumetric_debris, safety_flags)

    @staticmethod
    def chat_with_assistant(user_message: str) -> str:
        """
        Chats with the AI Assistant to provide environmental tips, cleanliness advice, and health rules.
        """
        if not GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not found. Running simulated Chat AI...")
            # Fallback mock responses
            lower_msg = user_message.lower()
            if "recycle" in lower_msg or "plastic" in lower_msg:
                return "Make sure to rinse plastic containers before recycling them! Food residue can contaminate an entire batch of recyclables."
            elif "battery" in lower_msg or "electronics" in lower_msg or "hazard" in lower_msg:
                return "Never throw batteries or electronics in regular trash! They leak toxic heavy metals into the soil. Drop them off at your local Best Buy or municipal hazardous waste facility."
            elif "health" in lower_msg or "clean" in lower_msg:
                return "Always wear puncture-resistant gloves and long sleeves when participating in cleanups. Wash hands thoroughly and use hand sanitizer after handling debris."
            else:
                return "That's a great question! As your EcoFix Assistant, I recommend checking local municipal guidelines for the most accurate environmental advice. Is there a specific material you're trying to dispose of?"

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            
            prompt = f"""
            You are the EcoFix AI Assistant, a helpful expert on environmental protection, recycling, civic cleanliness, and health safety during community cleanups.
            Keep your responses concise, friendly, and practical.
            
            User says: "{user_message}"
            """
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "text/plain"
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                result_json = response.json()
                return result_json['candidates'][0]['content']['parts'][0]['text'].strip()
            else:
                logger.error(f"Gemini API chat error: {response.text}")
                return "Sorry, I am having trouble connecting to the network right now."
        except Exception as e:
            logger.error(f"Error in chat_with_assistant: {str(e)}")
            return "Sorry, I am having trouble connecting to my brain right now."

    @staticmethod
    def _simulate_image_intake(image_url: str) -> Dict[str, Any]:
        """
        Simulates the visual AI intake. Parses the filename/url to create highly contextual mock results.
        """
        url_lower = image_url.lower()
        
        # Scenario: Downed Power Lines / Heavy Hazardous Waste (Municipal Escalation Bypass)
        if "hazardous" in url_lower or "powerline" in url_lower or "toxic" in url_lower or "wires" in url_lower or "collapse" in url_lower:
            return {
                "volumetric_estimate": "N/A - Escalated",
                "safety_flags": ["downed_power_lines", "electrocution_hazard", "structural_collapse"],
                "municipal_escalation": True,
                "hazard_level": "critical",
                "reasoning": "Detected structural threat and high voltage cables in close proximity to public path. Direct citizen risk is too high; triggered municipal routing bypass."
            }
            
        # Scenario: River / Waterway Pollution
        elif "river" in url_lower or "water" in url_lower or "stream" in url_lower or "creek" in url_lower:
            return {
                "volumetric_estimate": "1.8 cubic yards",
                "safety_flags": ["water_proximity", "slippery_slopes", "unknown_liquids"],
                "municipal_escalation": False,
                "hazard_level": "medium",
                "reasoning": "Accumulated plastics and light debris lining a stream bank. Risk of water pollution. Citizen-led clean-up is safe with proper safety footwear and gloves."
            }
            
        # Scenario: illegal Dumping (Trash, Tires, Furniture)
        elif "dump" in url_lower or "trash" in url_lower or "tires" in url_lower or "debris" in url_lower:
            return {
                "volumetric_estimate": "5.4 cubic yards",
                "safety_flags": ["sharp_objects", "heavy_lifting", "rusted_metal"],
                "municipal_escalation": False,
                "hazard_level": "high",
                "reasoning": "Large pile of discarded furniture, rusted scrap metal, and automotive tires. Significant material density requiring cargo vehicles and heavy-lift gloves."
            }
            
        # Default fallback
        return {
            "volumetric_estimate": "2.5 cubic yards",
            "safety_flags": ["sharp_objects", "heavy_lifting"],
            "municipal_escalation": False,
            "hazard_level": "low",
            "reasoning": "General mixed rubbish dumped on public property. Easy sorting. Requires basic cleanup kits."
        }

    @staticmethod
    def _simulate_roadmap(title: str, volumetric_debris: str, safety_flags: List[str]) -> BespokeRoadmapResponse:
        """
        Simulates Bespoke Roadmap outputs matching the categories.
        """
        # Determine feasibility based on safety flags
        is_high_hazard = "rusted_metal" in safety_flags or "heavy_lifting" in safety_flags or "slippery_slopes" in safety_flags
        feasibility = 65 if is_high_hazard else 90
        
        # Build tasks based on flags
        tasks = []
        
        # Task 1: Prep & Supplies
        tasks.append(MicroTaskSchema(
            title="Coordinate Safety & Cleanup Gear",
            description=f"Acquire gloves, trash bags, and safety gear. Focus on handling: {', '.join(safety_flags)}.",
            role_required="Supply Coordinator"
        ))
        
        # Task 2: Sorting
        tasks.append(MicroTaskSchema(
            title="Sort Recyclables and Litter",
            description="Sort plastics, cardboard, and metal recyclables from the non-recyclable heap to reduce landfill volume.",
            role_required="Sorter"
        ))
        
        # Task 3: Heavy lifting (if needed)
        if "heavy_lifting" in safety_flags or "rusted_metal" in safety_flags:
            tasks.append(MicroTaskSchema(
                title="Haul Tires and Furniture Blocks",
                description="Move heavy discarded objects (tires, crates, rusted structures) into a consolidated heap for loading.",
                role_required="Heavy Lifter"
            ))
        
        # Task 4: Transport
        tasks.append(MicroTaskSchema(
            title="Transport Debris to Municipal Dump",
            description="Provide a pickup truck or utility vehicle to transport the bagged waste and tires to the local disposal center.",
            role_required="Transportation"
        ))
        
        # Calculate cost
        cost = 45.00
        if "heavy_lifting" in safety_flags:
            cost += 40.00  # Tool rental
        if "water_proximity" in safety_flags:
            cost += 20.00  # Wet-boots/ropes
            
        time_est = 3
        if "heavy_lifting" in safety_flags:
            time_est = 4
            
        desc = f"A grassroots community action to clear approximately {volumetric_debris} of trash and restore this civic space."
        
        return BespokeRoadmapResponse(
            project_title=title,
            project_description=desc,
            volumetric_debris=volumetric_debris,
            safety_flags=safety_flags,
            estimated_cost=cost,
            time_to_completion_hours=time_est,
            feasibility_score=feasibility,
            tasks=tasks
        )
