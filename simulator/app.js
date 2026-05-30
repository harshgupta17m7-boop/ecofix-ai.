// EcoFix AI - Standalone Simulator Controller Logic

// -------------------------------------------------------------
// 1. Initial State Database
// -------------------------------------------------------------
let userProfile = {
  id: "user-1",
  name: "Elena Rostova",
  points: 350,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
};

let projects = [
  {
    id: "proj-1",
    title: "Riverside Park Garbage Spill",
    description: "Accumulation of plastics and household waste near the river bank. Volunteers needed to bag and sort waste, and transport it to the local dump.",
    latitude: 40.7128,
    longitude: -74.0060,
    status: "active",
    estimated_cost: 65.00,
    current_funds: 35.00,
    volumetric_debris: "1.8 cubic yards",
    safety_flags: ["water_proximity", "slippery_slopes"],
    feasibility_score: 85,
    before_image_url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80",
    after_image_url: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    completed_at: null
  },
  {
    id: "proj-2",
    title: "Oak Avenue Sidewalk Clearing",
    description: "Discarded construction materials, tires, and metal scraps blocking the sidewalk and drainage ditch.",
    latitude: 40.7180,
    longitude: -74.0090,
    status: "active",
    estimated_cost: 85.00,
    current_funds: 85.00,
    volumetric_debris: "4.5 cubic yards",
    safety_flags: ["sharp_objects", "heavy_lifting", "rusted_metal"],
    feasibility_score: 68,
    before_image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
    after_image_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    completed_at: null
  }
];

let tasks = [
  {
    id: "task-1",
    project_id: "proj-1",
    title: "Coordinate safety waders & trash grabs",
    description: "Coordinate retrieval of safety boots and trash grabbers for steep river bank cleanups.",
    role_required: "Supply Coordinator",
    assigned_to: "user-2",
    assigned_name: "Marcus Chen",
    status: "pledged"
  },
  {
    id: "task-2",
    project_id: "proj-1",
    title: "Bag Litter Along Riverfront",
    description: "Sweep and pick up all plastic containers, wraps, and generic waste into bags along the 50m stream segment.",
    role_required: "Sorter",
    assigned_to: null,
    assigned_name: null,
    status: "open"
  },
  {
    id: "task-3",
    project_id: "proj-1",
    title: "Transport trash bags to dump",
    description: "Provide a flatbed or vehicle with large trunk to haul bagged waste to city landfill.",
    role_required: "Transportation",
    assigned_to: null,
    assigned_name: null,
    status: "open"
  },
  {
    id: "task-4",
    project_id: "proj-2",
    title: "Source protective thick-mesh gloves",
    description: "Acquire 5 pairs of steel-mesh safety gloves to handle rusted rebar and broken scrap elements.",
    role_required: "Supply Coordinator",
    assigned_to: "user-1",
    assigned_name: "Elena Rostova",
    status: "pledged"
  },
  {
    id: "task-5",
    project_id: "proj-2",
    title: "Sort scrap metal and tires",
    description: "Sort heavy tires and metal pieces to make loading and dump categorization easier.",
    role_required: "Sorter",
    assigned_to: null,
    assigned_name: null,
    status: "open"
  },
  {
    id: "task-6",
    project_id: "proj-2",
    title: "Load construction blocks & heavy debris",
    description: "Physically lift and consolidate concrete blocks and broken pallets into haul location.",
    role_required: "Heavy Lifter",
    assigned_to: null,
    assigned_name: null,
    status: "open"
  }
];

let municipalEscalations = [
  {
    id: "esc-1",
    image_url: "https://images.unsplash.com/photo-1599740831243-d97f3eabc7d3?w=800&auto=format&fit=crop&q=80",
    latitude: 40.7220,
    longitude: -74.0150,
    safety_flags: ["downed_power_lines", "electrocution_hazard"],
    hazard_level: "critical",
    reasoning: "High-voltage transmission line snapped and resting on metallic fence in residential alleyway. Citizens rerouted; dispatched to local grid utility and fire safety crew.",
    escalated_at: new Date().toISOString()
  }
];

// Leaflet Map instance
let map = null;
let mapMarkers = [];
let mapCircles = [];

// -------------------------------------------------------------
// 2. View Tab Switching & Initialization
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Lucide Icons initialization
  lucide.createIcons();

  // Tab Switcher
  const navItems = document.querySelectorAll(".nav-item");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      
      navItems.forEach(n => n.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(`tab-${targetTab}`).classList.add("active");

      // Lazily initialize Leaflet Map when map tab is clicked
      if (targetTab === "map-view") {
        setTimeout(initLeafletMap, 100);
      }
    });
  });

  // Modal Closer
  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  document.getElementById("project-detail-modal").addEventListener("click", (e) => {
    if (e.target.id === "project-detail-modal") closeModal();
  });

  // Intake Photo selector
  const thumbs = document.querySelectorAll(".mock-thumb");
  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      
      // Update coordinates dynamically to mock contextual scenarios
      const imgType = thumb.getAttribute("data-img");
      if (imgType === "river") {
        document.getElementById("gps-lat").value = "40.7145";
        document.getElementById("gps-lng").value = "-74.0080";
      } else if (imgType === "dump") {
        document.getElementById("gps-lat").value = "40.7160";
        document.getElementById("gps-lng").value = "-74.0110";
      } else if (imgType === "wire") {
        document.getElementById("gps-lat").value = "40.7220";
        document.getElementById("gps-lng").value = "-74.0150";
      }
    });
  });

  // Run AI Ingestion
  document.getElementById("btn-run-intake").addEventListener("click", triggerAIIntake);

  // Render initial panels
  renderProjectsFeed();
  renderEscalations();
  updateBadgeCounts();
});

function updateBadgeCounts() {
  document.getElementById("muni-badge-count").textContent = municipalEscalations.length;
}

function updatePoints(amount) {
  userProfile.points += amount;
  document.getElementById("user-points").textContent = userProfile.points;
  
  // Visual pulse animation on points indicator
  const badge = document.querySelector(".points-badge");
  badge.style.transform = "scale(1.2)";
  badge.style.transition = "transform 0.15s ease";
  setTimeout(() => {
    badge.style.transform = "scale(1)";
  }, 200);
}

// -------------------------------------------------------------
// 3. Render Projects Feed Panel
// -------------------------------------------------------------
function renderProjectsFeed() {
  const listContainer = document.getElementById("projects-list");
  listContainer.innerHTML = "";

  if (projects.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-feed glass-panel" style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <i data-lucide="info" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3>No Active Projects</h3>
        <p style="color: var(--text-muted); font-size: 13px;">Use the Ingestion Terminal to report new environmental sites.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  projects.forEach(p => {
    const isCompleted = p.status === "completed";
    const progress = (p.current_funds / p.estimated_cost) * 100;
    const isHighFeas = p.feasibility_score >= 80;
    const isMedFeas = p.feasibility_score >= 60;
    const feasClass = isHighFeas ? "feasibility-high" : isMedFeas ? "feasibility-medium" : "feasibility-low";

    const card = document.createElement("div");
    card.className = `project-card glass-panel ${isCompleted ? 'completed-card' : ''}`;
    card.addEventListener("click", () => openProjectModal(p.id));

    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${isCompleted ? p.after_image_url : p.before_image_url}" alt="Civic Site">
        <span class="card-status-badge">${p.status}</span>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <h3>${p.title}</h3>
          <span class="feasibility-badge ${feasClass}">${p.feasibility_score}% Feas</span>
        </div>
        <p class="card-desc">${p.description}</p>
        <div class="card-tags">
          <span class="card-tag tag-vol"><i data-lucide="box" style="width: 10px; height: 10px; display: inline; vertical-align: middle; margin-right: 4px;"></i>${p.volumetric_debris}</span>
          ${p.safety_flags.map(f => `<span class="card-tag tag-hazard">${f.replace('_', ' ')}</span>`).join('')}
        </div>
        ${!isCompleted ? `
          <div class="card-progress">
            <div class="progress-labels">
              <span class="progress-raised">Raised: $${p.current_funds.toFixed(2)} / $${p.estimated_cost.toFixed(2)}</span>
              <span class="progress-pct">${Math.round(progress)}%</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill" style="width: ${Math.min(100, progress)}%"></div>
            </div>
          </div>
        ` : `
          <div class="card-progress" style="color: var(--color-primary); font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> Verified Closed Out
          </div>
        `}
      </div>
    `;

    listContainer.appendChild(card);
  });

  lucide.createIcons();
}

// -------------------------------------------------------------
// 4. Render Municipal Escalation Bypass Panel
// -------------------------------------------------------------
function renderEscalations() {
  const container = document.getElementById("escalations-list");
  container.innerHTML = "";

  if (municipalEscalations.length === 0) {
    container.innerHTML = `
      <div class="empty-feed glass-panel" style="text-align: center; padding: 40px;">
        <h3>No Municipal Escalations</h3>
        <p style="color: var(--text-muted); font-size: 13px;">No critical hazards currently bypassing volunteers.</p>
      </div>
    `;
    return;
  }

  municipalEscalations.forEach(esc => {
    const card = document.createElement("div");
    card.className = "escalated-card glass-panel";
    
    const formattedDate = new Date(esc.escalated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <img src="${esc.image_url}" class="esc-img" alt="Dangerous waste">
      <div class="esc-content">
        <div class="esc-header">
          <h3>Escalation Site #${esc.id.slice(-3)}</h3>
          <span class="badge-dangerous">CRITICAL ROUTING BYPASS</span>
        </div>
        <p class="esc-desc">${esc.reasoning}</p>
        <div class="card-tags" style="margin-bottom: 8px;">
          ${esc.safety_flags.map(f => `<span class="card-tag tag-hazard">${f.replace('_', ' ')}</span>`).join('')}
        </div>
        <div class="esc-meta">
          <span>Coordinates: ${esc.latitude.toFixed(4)}, ${esc.longitude.toFixed(4)}</span>
          <span>Routed at: ${formattedDate}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 5. Ingestion & Intake Process Simulator
// -------------------------------------------------------------
// Haversine distance in JS (simulates ST_DWithin PostGIS checks)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function triggerAIIntake() {
  const activeThumb = document.querySelector(".mock-thumb.active");
  if (!activeThumb) return;

  const imageUrl = activeThumb.getAttribute("data-url");
  const imgType = activeThumb.getAttribute("data-img");
  const lat = parseFloat(document.getElementById("gps-lat").value);
  const lng = parseFloat(document.getElementById("gps-lng").value);

  if (isNaN(lat) || isNaN(lng)) {
    alert("Please enter valid decimal coordinates.");
    return;
  }

  const outputScreen = document.getElementById("intake-output-screen");
  
  // Show AI analysis progress spinner
  outputScreen.innerHTML = `
    <div class="ai-loading-screen">
      <div class="spinner"></div>
      <h3 id="ai-progress-stage">Ingesting report payload...</h3>
      <p style="color: var(--text-muted); font-size: 12px; max-width: 250px; text-align: center;" id="ai-progress-detail">Parsing image pixels & matching coordinates</p>
    </div>
  `;

  // Simulate progress steps
  const stages = [
    { title: "Analyzing image structural contours...", detail: "Estimating material volumetric space" },
    { title: "Calculating spatial density...", detail: "Estimated debris cubic density metric" },
    { title: "Scanning safety hazard matrices...", detail: "Checking water drains, sharp metal, power cables" },
    { title: "Civic routing evaluation...", detail: "Checking threshold limits for citizen safety" },
    { title: "Geospatial clustering queries...", detail: "Running PostgreSQL PostGIS ST_DWithin radius check" }
  ];

  let step = 0;
  const timer = setInterval(() => {
    if (step < stages.length) {
      document.getElementById("ai-progress-stage").textContent = stages[step].title;
      document.getElementById("ai-progress-detail").textContent = stages[step].detail;
      step++;
    } else {
      clearInterval(timer);
      finalizeIntake(imgType, imageUrl, lat, lng);
    }
  }, 800);
}

function finalizeIntake(imgType, imageUrl, lat, lng) {
  const outputScreen = document.getElementById("intake-output-screen");

  // 1. PostGIS Duplicate check (within 25 meters)
  for (let proj of projects) {
    if (proj.status === "active") {
      const dist = calculateDistance(lat, lng, proj.latitude, proj.longitude);
      if (dist <= 25.0) {
        outputScreen.innerHTML = `
          <div class="ai-report-view">
            <div class="ai-report-header">
              <h3>Ingestion Output</h3>
              <span class="ai-badge" style="background: var(--color-danger-glow); color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3)">DUPLICATE BLOCKED</span>
            </div>
            <div class="ai-reasoning-block" style="text-align: center; padding: 20px 0;">
              <i data-lucide="files" style="width: 48px; height: 48px; color: var(--color-danger); margin-bottom: 12px;"></i>
              <h4 style="color: #fff; font-size: 16px; margin-bottom: 8px;">Geospatial Cluster Match</h4>
              <p style="margin-bottom: 16px;">This issue lies within <strong>${dist.toFixed(1)} meters</strong> of an active project: <strong>"${proj.title}"</strong>.</p>
              <p style="color: var(--text-muted); font-size: 11px; margin-bottom: 20px;">Platform merged your upload into the existing project thread to prevent crowdsourced resource fragmentation.</p>
              <button class="btn btn-primary" onclick="openProjectModal('${proj.id}')">View Existing Thread</button>
            </div>
          </div>
        `;
        lucide.createIcons();
        return;
      }
    }
  }

  // 2. Municipal Escalation (Hazardous Wires)
  if (imgType === "wire") {
    const escId = `esc-${Math.random().toString(36).substring(2, 6)}`;
    const newEsc = {
      id: escId,
      image_url: imageUrl,
      latitude: lat,
      longitude: lng,
      safety_flags: ["downed_power_lines", "electrocution_hazard"],
      hazard_level: "critical",
      reasoning: "High-voltage wires found in close proximity to residential sidewalk. Directly bypassing community resources and escalating immediately to public works safety teams.",
      escalated_at: new Date().toISOString()
    };
    
    municipalEscalations.unshift(newEsc);
    renderEscalations();
    updateBadgeCounts();

    outputScreen.innerHTML = `
      <div class="ai-report-view">
        <div class="ai-report-header">
          <h3>Ingestion Output</h3>
          <span class="ai-badge" style="background: var(--color-danger-glow); color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3)">MUNICIPAL BYPASS</span>
        </div>
        <div class="ai-hazards-block">
          <h4>🚨 CRITICAL RISK BYPASS TRIGGERED</h4>
          <p>This report involves hazardous power cables. Civic volunteer actions are suspended. Dispatched record to city public safety squad.</p>
        </div>
        <div class="ai-reasoning-block">
          <h4>AI Rationale</h4>
          <p>${newEsc.reasoning}</p>
        </div>
        <div class="ai-metrics-row">
          <div class="ai-metric-box">
            <label>Hazard Level</label>
            <span style="color: var(--color-danger)">CRITICAL</span>
          </div>
          <div class="ai-metric-box">
            <label>Recipient</label>
            <span>City Grid Utility</span>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // 3. Normal Active Project Creation
  let title = "";
  let desc = "";
  let volume = "";
  let hazards = [];
  let feasibility = 80;
  let cost = 50.00;
  let proj_tasks = [];

  if (imgType === "river") {
    title = "Riverside Stream Cleanup";
    desc = "Clear plastic litter lining the stream bank to prevent ecosystem contamination. Requires trash grabbers and boots.";
    volume = "2.1 cubic yards";
    hazards = ["water_proximity", "slippery_slopes"];
    feasibility = 88;
    cost = 45.00;
    proj_tasks = [
      { id: `task-r1`, title: "Source cleanup waders and trash grabbers", desc: "Coordinate retrieval of safety boots and grabbers.", role: "Supply Coordinator" },
      { id: `task-r2`, title: "Bag stream rubbish along banks", desc: "Gather all surface plastic containers and bag them.", role: "Sorter" },
      { id: `task-r3`, title: "Truck transport to dump site", desc: "Load and transport cleanup bags to dump site.", role: "Transportation" }
    ];
  } else {
    title = "East Lane Alley Cleanup";
    desc = "Large pile of discarded construction rubble, wooden crates, and rusted tires blocking a public path. Needs heavy lifting gloves and transport trucks.";
    volume = "5.6 cubic yards";
    hazards = ["sharp_objects", "heavy_lifting", "rusted_metal"];
    feasibility = 62;
    cost = 90.00;
    proj_tasks = [
      { id: `task-d1`, title: "Procure mesh steel-wire gloves", desc: "Bring thick-mesh protective gloves for rusted elements.", role: "Supply Coordinator" },
      { id: `task-d2`, title: "Sort timber, metals, and scrap tires", desc: "Break up heap items to make hauling faster.", role: "Sorter" },
      { id: `task-d3`, title: "Load concrete pallets and blocks", desc: "Manually load concrete rubble segments onto flatbed.", role: "Heavy Lifter" },
      { id: `task-d4`, title: "Dump haul to local recycle scrap yard", desc: "Haul sorted items to scrap yard recyclers.", role: "Transportation" }
    ];
  }

  const projId = `proj-${Math.random().toString(36).substring(2, 6)}`;
  const newProj = {
    id: projId,
    title: title,
    description: desc,
    latitude: lat,
    longitude: lng,
    status: "active",
    estimated_cost: cost,
    current_funds: 0.00,
    volumetric_debris: volume,
    safety_flags: hazards,
    feasibility_score: feasibility,
    before_image_url: imageUrl,
    after_image_url: null,
    created_at: new Date().toISOString(),
    completed_at: null
  };

  projects.unshift(newProj);
  
  // Add new tasks
  proj_tasks.forEach(t => {
    tasks.push({
      id: t.id,
      project_id: projId,
      title: t.title,
      description: t.desc,
      role_required: t.role,
      assigned_to: null,
      assigned_name: null,
      status: "open"
    });
  });

  renderProjectsFeed();
  
  // Re-initialize map if it was already created, to plot the new marker
  if (map) {
    addMapMarker(newProj);
  }

  // Display AI success summary in intake panel
  outputScreen.innerHTML = `
    <div class="ai-report-view">
      <div class="ai-report-header">
        <h3>Ingestion Output</h3>
        <span class="ai-badge">APPROVED & ROADMAPPED</span>
      </div>
      <div class="ai-reasoning-block">
        <h4>Visual Identification</h4>
        <p>${desc}</p>
      </div>
      <div class="ai-metrics-row">
        <div class="ai-metric-box">
          <label>Estimated Debris Volume</label>
          <span style="color: var(--color-primary)">${volume}</span>
        </div>
        <div class="ai-metric-box">
          <label>Feasibility Index</label>
          <span style="color: var(--color-warning)">${feasibility}% Match</span>
        </div>
      </div>
      <div class="ai-hazards-block">
        <h4>Safety Measures Flagged</h4>
        <p>Precautionary apparel recommended. Flags: ${hazards.map(h => h.replace('_', ' ')).join(', ')}.</p>
      </div>
      <div class="ai-reasoning-block" style="text-align: right; padding-top: 8px;">
        <button class="btn btn-primary" onclick="openProjectModal('${projId}')">Open Roadmap View</button>
      </div>
    </div>
  `;
  lucide.createIcons();
}

// -------------------------------------------------------------
// 6. Interactive Leaflet Map Rendering
// -------------------------------------------------------------
function initLeafletMap() {
  if (map) return; // avoid double init

  // Centered around coordinate center of initial points
  map = L.map("leaflet-map-container").setView([40.715, -74.007], 14);

  // Apply dark mode tiles (using CartoDB Dark Matter tiles)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Plot existing active projects
  projects.forEach(p => {
    addMapMarker(p);
  });
}

function addMapMarker(proj) {
  if (!map) return;

  const isCompleted = proj.status === "completed";
  
  // Custom Green Circle Marker for Active Projects
  const marker = L.circleMarker([proj.latitude, proj.longitude], {
    radius: 8,
    fillColor: isCompleted ? "#4b5563" : "#10b981",
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9
  }).addTo(map);

  // 2km Notification broadcast ring (Circle)
  const broadcastRing = L.circle([proj.latitude, proj.longitude], {
    radius: 2000,
    color: "#10b981",
    weight: 1,
    fillColor: "#10b981",
    fillOpacity: 0.03,
    opacity: 0.25
  }).addTo(map);

  // 25m De-duplication boundary (Circle)
  const duplicateBoundary = L.circle([proj.latitude, proj.longitude], {
    radius: 25,
    color: "#ef4444",
    weight: 1,
    fillColor: "#ef4444",
    fillOpacity: 0.1,
    opacity: 0.4
  }).addTo(map);

  // Bind callout popup
  marker.bindPopup(`
    <div class="map-popup">
      <h3>${proj.title}</h3>
      <p>Volume: ${proj.volumetric_debris}</p>
      <p>Status: <strong style="color: ${isCompleted ? 'var(--text-muted)' : 'var(--color-primary)'}">${proj.status.toUpperCase()}</strong></p>
      <button onclick="openProjectModal('${proj.id}')">Open Project</button>
    </div>
  `);

  mapMarkers.push(marker);
  mapCircles.push(broadcastRing);
  mapCircles.push(duplicateBoundary);
}

// -------------------------------------------------------------
// 7. Modal Project Detail & Micro-task Coordinator
// -------------------------------------------------------------
let activeProjectIdModal = null;

function openProjectModal(projectId) {
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return;

  activeProjectIdModal = projectId;
  const isCompleted = proj.status === "completed";

  // Fill modal headers
  document.getElementById("modal-project-img").src = isCompleted ? proj.after_image_url : proj.before_image_url;
  document.getElementById("modal-project-title").textContent = proj.title;
  document.getElementById("modal-project-desc").textContent = proj.description;
  
  const statusBadge = document.getElementById("modal-project-status");
  statusBadge.textContent = proj.status;
  statusBadge.style.background = isCompleted ? "var(--text-dark)" : "var(--color-primary)";

  // Fill AI metrics panel
  document.getElementById("modal-ai-volume").textContent = proj.volumetric_debris;
  document.getElementById("modal-ai-feasibility").textContent = `${proj.feasibility_score}/100`;
  
  const hazardContainer = document.getElementById("modal-ai-hazards");
  hazardContainer.innerHTML = "";
  if (proj.safety_flags.length > 0) {
    proj.safety_flags.forEach(f => {
      const pill = document.createElement("span");
      pill.className = "hazard-pill";
      pill.textContent = f.replace('_', ' ');
      hazardContainer.appendChild(pill);
    });
  } else {
    hazardContainer.innerHTML = `<span style="font-size: 11px; color: var(--text-muted)">No hazards flagged</span>`;
  }

  // Crowdfunding details
  const fundingCard = document.getElementById("modal-funding-card");
  if (isCompleted) {
    fundingCard.style.display = "none";
  } else {
    fundingCard.style.display = "block";
    updateModalFundingUI(proj);
  }

  // Render tasks list
  renderModalTasks(projectId);

  // Prove fix button visibility
  const proveBtn = document.getElementById("btn-prove-fix");
  if (isCompleted) {
    proveBtn.style.display = "none";
  } else {
    proveBtn.style.display = "block";
    proveBtn.onclick = triggerProofToFix;
  }

  // Bind crowdfunding contribute button
  document.getElementById("btn-back-project").onclick = contributeFunding;

  // Show modal
  document.getElementById("project-detail-modal").classList.add("active");
}

function closeModal() {
  document.getElementById("project-detail-modal").classList.remove("active");
  activeProjectIdModal = null;
}

function updateModalFundingUI(proj) {
  const progress = (proj.current_funds / proj.estimated_cost) * 100;
  
  document.getElementById("modal-funding-raised").textContent = `$${proj.current_funds.toFixed(2)}`;
  document.getElementById("modal-funding-target").textContent = `$${proj.estimated_cost.toFixed(2)}`;
  document.getElementById("modal-funding-pct").textContent = `${Math.round(progress)}%`;
  document.getElementById("modal-funding-fill").style.width = `${Math.min(100, progress)}%`;

  const controls = document.getElementById("funding-controls");
  if (progress >= 100) {
    controls.innerHTML = `<p style="font-size: 12px; color: var(--color-primary); font-weight: bold; width: 100%; text-align: center;">✓ FUNDING GOAL REACHED</p>`;
  } else {
    controls.innerHTML = `
      <input type="number" id="input-backing-amt" placeholder="$ Amount" min="1">
      <button class="btn btn-accent btn-sm" id="btn-back-project" onclick="contributeFunding()">Contribute</button>
    `;
  }
}

function renderModalTasks(projectId) {
  const container = document.getElementById("modal-task-list");
  container.innerHTML = "";

  const projTasks = tasks.filter(t => t.project_id === projectId);
  const proj = projects.find(p => p.id === projectId);
  const isProjCompleted = proj.status === "completed";

  projTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";
    
    let footerContent = "";
    if (task.status === "open" && !isProjCompleted) {
      footerContent = `<button class="btn btn-primary btn-sm" onclick="pledgeTask('${task.id}')">Pledge Work</button>`;
    } else if (task.status === "pledged") {
      footerContent = `<span class="pledge-status-text">🤝 Pledged by ${task.assigned_name}</span>`;
    } else {
      footerContent = `<span class="pledge-status-text" style="color: var(--text-muted)">✓ Completed</span>`;
    }

    item.innerHTML = `
      <div class="task-item-header">
        <span class="task-item-title">${task.title}</span>
        <span class="task-item-role">${task.role_required}</span>
      </div>
      <p class="task-item-desc">${task.description}</p>
      <div class="task-item-footer">
        ${footerContent}
      </div>
    `;

    container.appendChild(item);
  });
}

function pledgeTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = "pledged";
  task.assigned_to = userProfile.id;
  task.assigned_name = userProfile.name;

  // Re-render
  renderModalTasks(activeProjectIdModal);
  alert("Micro-task pledged successfully! Bring gloves/efforts on schedule.");
}

function contributeFunding() {
  const proj = projects.find(p => p.id === activeProjectIdModal);
  if (!proj) return;

  const amtInput = document.getElementById("input-backing-amt");
  const amt = parseFloat(amtInput.value);

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid contribution amount.");
    return;
  }

  // Update current funds
  proj.current_funds = Math.min(proj.estimated_cost, proj.current_funds + amt);
  
  // Update UI
  updateModalFundingUI(proj);
  renderProjectsFeed();
  alert(`Thank you! Successfully backed $${amt.toFixed(2)} for this community cleanup.`);
}

// -------------------------------------------------------------
// 8. Proof-To-Fix (Project Closure)
// -------------------------------------------------------------
function triggerProofToFix() {
  const proj = projects.find(p => p.id === activeProjectIdModal);
  if (!proj) return;

  const confirmClose = confirm(
    "Submit Proof-to-Fix Closeout?\n\nEcoFix AI will compare 'Before' and 'After' perspective geometries. Approved triggers award 150 pts to reporter and 100 pts to active volunteers."
  );

  if (confirmClose) {
    // Transition status to completed
    proj.status = "completed";
    proj.after_image_url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80"; // scenic field
    proj.completed_at = new Date().toISOString();

    // Mark all tasks as completed
    const projTasks = tasks.filter(t => t.project_id === activeProjectIdModal);
    projTasks.forEach(t => {
      t.status = "completed";
      
      // Award 100 points to volunteers who pledged (excluding current closeout reporter)
      if (t.assigned_to && t.assigned_to !== userProfile.id) {
        // Mock points boost to other volunteers (silent)
        console.log(`Volunteer points updated for ${t.assigned_name}`);
      }
    });

    // Award 150 points to Elena (the closeout reporter)
    updatePoints(150);

    // Refresh Panels
    renderProjectsFeed();
    
    // Close modal & show success alert
    closeModal();
    alert("🏆 Proof-to-Fix Approved!\n\nAI geometry validated. 150 points added to your balance. The local map state has been updated.");

    // Update map marker color if map has been initialized
    if (map) {
      // Clear markers and replot
      mapMarkers.forEach(m => map.removeLayer(m));
      mapCircles.forEach(c => map.removeLayer(c));
      mapMarkers = [];
      mapCircles = [];
      projects.forEach(p => addMapMarker(p));
    }
  }
}
