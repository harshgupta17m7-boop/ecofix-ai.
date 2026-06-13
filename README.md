# EcoFix AI 🌍📱

> **Fix Your City, Powered by AI.**

EcoFix AI is a mobile application designed to empower citizens to quickly report environmental hazards and organize community cleanups. 

Instead of waiting weeks for local authorities to process a simple email complaint, EcoFix uses multimodal AI to instantly analyze user-submitted photos, estimate the volume of trash, flag dangerous materials, and automatically generate a step-by-step roadmap for a civic cleanup crew. 

---

## 🚀 The Tech Stack

I built this project using a modern, decoupled full-stack architecture to ensure it remains fast and scalable across both mobile and server environments.

* **Frontend:** React Native running on the **Expo** framework. Allows for cross-platform (iOS/Android) deployment from a single codebase while easily hooking into native physical hardware like the camera and GPS.
* **Backend:** Python using **FastAPI**. It handles asynchronous data payloads instantly and automatically generates strict data validation schemas using Pydantic.
* **AI Engine:** Google **Gemini Multimodal Vision API**. Parses Base64 image byte streams to perform hazard recognition and volumetric analysis.

---

## 🌟 Key Features

* **Real-time Hazard Detection:** Snap a photo of a trash heap, and the AI will scan it for sharp objects, rusted metal, or toxic waste.
* **Bespoke Roadmapping:** The AI breaks down the cleanup into specific "Micro-Tasks" (e.g., Heavy Lifter, Supply Coordinator) so community members can pledge to help based on their abilities.
* **Municipal Bypass:** If the AI detects a critical hazard (like a downed power line), it automatically blocks citizen cleanup attempts and flags the incident for municipal emergency dispatch.
* **Geospatial Mapping:** View all active projects in your city on an interactive dark-mode map, pinpointed using exact GPS metadata.

---

## 🛠️ How to Run Locally

If you want to spin this up on your own machine, follow these steps:

### 1. Start the Backend (FastAPI)
1. Navigate into the backend folder: `cd backend`
2. Create a `.env` file and add your Gemini API Key: `GEMINI_API_KEY=your_key_here`
3. Install the dependencies: `uv pip install -r requirements.txt` (or use standard pip)
4. Start the server: `uv run uvicorn main:app --host 0.0.0.0 --port 8000`

### 2. Start the Frontend (Expo)
1. Open a new terminal and navigate to the mobile folder: `cd mobile`
2. Update the `API_URL` variable in the screen files to match your computer's local Wi-Fi IP address.
3. Install dependencies: `npm install`
4. Start the Expo bundler: `npm start`
5. Scan the QR code using the Expo Go app on your physical phone!

---

## 🚧 Current Limitations & Roadmap

*This is currently a V1 MVP built for learning purposes.*

* **In-Memory Database:** Currently, the backend uses Python dictionaries to store projects. If the server restarts, data is wiped. **Next step:** Migrate to Firebase Firestore for persistent data storage.
* **Mock Authentication:** Users are currently hardcoded to a mock profile. **Next step:** Integrate real OAuth/Firebase Authentication.

---

### Contributing

I am actively building and learning! If you are an experienced developer and notice architectural mistakes, bad practices, or just want to help me integrate the Firebase database, I am officially welcoming **Pull Requests** and **Issues**. Feel free to fork the repo and help me clean up our cities!
