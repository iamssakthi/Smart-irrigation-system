# TerraSense IQ — Intelligent Irrigation. Data-Driven Agriculture.

> **Product Category:** Smart Agriculture Monitoring Platform  
> **Primary Module:** Intelligent Irrigation Control  
> **Simulation Module:** Virtual Field Lab  
> **Reference Architecture:** Intelligent Sensor-Based Automated Irrigation System Using Raspberry Pi and IoT Technology

A premium, simulation-first smart agriculture monitoring platform built with **React 19, Vite, Recharts, and Flask (Python)**.

---

## 🌾 Product Identity & Overview

**TerraSense IQ** is a simulation-first smart agriculture monitoring platform that demonstrates closed-loop soil moisture evaluation, dual-threshold hysteresis irrigation decisions, virtual pump control, historical telemetry analysis, and automated irrigation workflows.

The application operates without requiring physical hardware. All sensor readings, irrigation states, and water-flow animations are model-driven and clearly identified as simulated. Physical Raspberry Pi hardware, MCP3008 ADCs, and capacitive probes are documented as the intended target physical deployment architecture.

### Key Capabilities
- **Refined Light Theme Design System**: Industrial agricultural design tokens (forest green `#176B4D`, secondary green `#2E8B62`, subtle green `#EAF5EF`), typography scale, and subtle elevation.
- **Fixed & Responsive Recharts Graphs**: Chronological moisture trajectory with live dry-trigger (`35%`) and adequate-moisture (`45%`) threshold reference lines, with solved flexbox container sizing to prevent layout blowout.
- **Virtual Field Lab**: 7-stage interactive pipeline visualization (`Virtual Soil Input` &rarr; `Sensor Simulation` &rarr; `ESP32 Logic Model` &rarr; `Moisture Interpretation` &rarr; `Irrigation Decision Engine` &rarr; `Virtual Pump State` &rarr; `Dashboard & Event History`), scenario presets, dynamic decision reasoning, and animated plant/pump digital twin.
- **Dedicated Clear History Action**: Destructive action with confirmation modal, granular selection (all, readings only, or events only), and zero loss of configuration or threshold settings.
- **Live Monitoring & Diagnostics**: Simulated 12-bit ADC mapping, telemetry freshness tracking, and live polling rate adjustments.
- **History & Analytics with CSV Export**: Filtered historical reports by date range, condition, and source, with direct CSV export.
- **Dual-Threshold Hysteresis**: Algorithmic hysteresis deadband preventing relay chatter and pump short-cycling.

---

## 🏛️ System Architecture

```text
TerraSense IQ Frontend (React 19, Vite, Recharts, Lucide)
  │
  ▼ [HTTP REST / JSON]
Flask Backend API (irrigation/routes.py)
  │
  ├───────────────────────────────────┐
  ▼                                   ▼
Irrigation Controller Engine        Simulation Service
(Dual-Threshold Hysteresis)         (Virtual ESP32 ADC & Environment)
  │                                   │
  └─────────────────┬─────────────────┘
                    ▼
          SQLite Database (irrigation.db)
          ├── sensor_readings
          ├── irrigation_events
          └── settings (Thresholds & Mode)
```

> **IMPORTANT DISCLAIMER:**
> TerraSense IQ operates as a simulation-first platform. All sensor inputs, moisture values, pump states, and relay activations are simulated and labeled as such. Physical Raspberry Pi 4, MCP3008 ADC, and capacitive soil probe hardware are documented as target physical deployment reference designs.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**

### Option A: Running the Production Build (Recommended)

1. Activate your virtual environment and install Python dependencies:
   ```powershell
   cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system"
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

2. Build the React frontend:
   ```powershell
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Launch the Flask application:
   ```powershell
   python app.py
   ```

4. Open your browser:
   ```text
   http://127.0.0.1:5000/
   ```
   Flask automatically serves the compiled React application directly on port 5000.

---

### Option B: Frontend Development Mode (Hot Reloading)

1. Start the Flask backend in terminal 1:
   ```powershell
   cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system"
   python app.py
   ```

2. Start the Vite development server in terminal 2:
   ```powershell
   cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system\frontend"
   npm run dev
   ```

3. Open your browser at `http://localhost:5173/`. All API calls to `/api/*` are proxied to Flask on port 5000.

---

## 🧪 Automated Testing

Run the full backend test suite covering API routes, hysteresis controller logic, targeted clear history, and SPA route resolution:

```powershell
cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system"
.\.venv\Scripts\python -m pytest
```

---

## 📑 Application Navigation & Modules

| Route | Module | Purpose |
| :--- | :--- | :--- |
| `/` | **Overview** | System health at a glance, key stat cards, responsive Recharts graph with threshold reference lines, quick moisture slider, and recent event logs. |
| `/monitoring` | **Live Monitoring** | Real-time telemetry feed, virtual 12-bit ADC mapping, telemetry freshness indicator, and stream polling controls. |
| `/simulation` | **Virtual Field Lab** | 7-stage interactive pipeline diagram, quick-test presets (Dry, Transition, Adequate, Saturated), dynamic decision reasoning engine, and digital-twin plant/pump animation. |
| `/history` | **History & Analytics** | Historical analytics chart, date/condition/source filters, records table, CSV export, and safe Clear History management dialog. |
| `/events` | **Irrigation Events** | Chronological audit trail of pump triggers, manual commands, and mode transitions with event type filters. |
| `/settings` | **Configuration** | Configuration of dry trigger and adequate moisture target thresholds with validation, visual hysteresis band preview, and appearance theme preference. |
| `/system-info` | **System Information** | Architecture specifications, mathematical hysteresis formulation, simulation vs physical Raspberry Pi 4 hardware roadmap, and REST API documentation. |

---

## 📡 REST API Reference

- `GET /api/status`: Current system state, thresholds, mode, and pump status.
- `GET /api/readings`: Filtered historical sensor readings (`?limit=50&source=...&soil_status=...`).
- `GET /api/events`: Audited irrigation events (`?limit=50&event_type=...`).
- `POST /api/simulate`: Ingest simulated soil moisture (`{"moisture": 28.5, "source": "virtual_field_lab"}`).
- `POST /api/control`: Manual pump command (`{"command": "ON" | "OFF"}`).
- `POST /api/mode`: Toggle operating mode (`{"mode": "AUTOMATIC" | "MANUAL"}`).
- `POST /api/settings`: Save hysteresis thresholds (`{"dry_threshold": 35.0, "wet_threshold": 45.0}`).
- `POST /api/history/clear`: Clear history records (`{"target": "all" | "readings" | "events"}`).
- `GET /reset-demo`: Reset SQLite database to baseline demo defaults.
