# TerraSense IQ — Complete Setup & Deployment Guide

> **Product Name:** TerraSense IQ  
> **Tagline:** Intelligent Irrigation. Data-Driven Agriculture.  
> **Platform Version:** 2.0.0 (Production Quality)

---

## 1. System Requirements & Prerequisites

Before setting up TerraSense IQ, ensure your development or host machine satisfies the following prerequisites:

| Requirement | Supported Versions | Verification Command |
| :--- | :--- | :--- |
| **Python** | Python 3.11, 3.12, or 3.13 | `python --version` |
| **Node.js** | Node.js 18.x, 20.x, or 22.x (LTS) | `node --version` |
| **Package Manager** | npm 9.x or 10.x | `npm --version` |
| **Database** | SQLite 3 (Bundled with standard Python library) | `python -c "import sqlite3; print(sqlite3.sqlite_version)"` |
| **Operating System** | Windows 10/11, macOS (Apple Silicon/Intel), Linux (Ubuntu/Debian/Raspberry Pi OS) | — |
| **Web Browser** | Chrome, Edge, Firefox, Safari (Modern Evergreen) | — |

---

## 2. Project Directory Layout

```text
Smart-irrigation-system/
├── app.py                   # Flask server entry point (port 5000)
├── config.py                # Environment configuration & database paths
├── irrigation.db            # SQLite relational database file
├── requirements.txt         # Python backend dependencies
├── irrigation/              # Python backend package
│   ├── __init__.py          # Flask application factory (create_app)
│   ├── controller.py        # Independent IrrigationController state machine
│   ├── database.py          # SQLite schema, queries, migrations & clear actions
│   ├── routes.py            # REST API endpoints & SPA catch-all router
│   ├── sensor.py            # Sensor abstraction layer
│   ├── services.py          # Orchestration layer connecting controller & DB
│   └── validation.py        # Input sanitation & threshold range validators
├── frontend/                # React 19 Single Page Application
│   ├── index.html           # HTML5 shell with Google Fonts & botanical favicon
│   ├── package.json         # Frontend dependencies (React, Vite, Recharts, Lucide)
│   ├── vite.config.js       # Vite configuration with proxy to port 5000
│   ├── dist/                # Production build output directory (generated)
│   └── src/                 # React components, pages, context, and styles
│       ├── api/client.js    # API service client
│       ├── components/      # UI components (Layout, Cards, Plant Animation)
│       ├── context/         # SystemContext global state bus
│       ├── pages/           # 7 application page modules
│       ├── App.jsx          # Route registry
│       ├── index.css        # TerraSense IQ design tokens & styles
│       └── main.jsx         # Mount entry point
├── tests/                   # Pytest automated test suite
│   ├── conftest.py          # Fixtures for database isolation during testing
│   ├── test_api.py          # REST API endpoints & route resolution tests
│   ├── test_controller.py   # Hysteresis state machine & threshold unit tests
│   └── test_database.py     # SQLite persistence & event logging tests
└── docs/                    # Complete architectural & deployment guides
    ├── frontend_and_simulation_guide.md
    ├── setup_guide.md
    └── project_report.md
```

---

## 3. Step-by-Step Installation

### Step 1: Open Terminal in Project Directory
Navigate to the root workspace directory:
```powershell
cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system"
```

---

### Step 2: Set Up Python Virtual Environment
Creating an isolated virtual environment (`.venv`) avoids dependency conflicts with global Python packages.

#### On Windows (PowerShell):
```powershell
# Create virtual environment:
python -m venv .venv

# If script execution is restricted on your machine, bypass for this session:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate virtual environment:
.\.venv\Scripts\Activate.ps1
```

#### On Windows (Command Prompt):
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### On Linux / macOS / Raspberry Pi OS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### Step 3: Install Python Backend Dependencies
With `.venv` active, install the required packages:
```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

*Contents of `requirements.txt`:*
- `Flask>=3.0.0`
- `pytest>=8.0.0`

---

### Step 4: Install Node.js Frontend Dependencies
Navigate into the `frontend/` directory and install the npm packages:
```powershell
cd frontend
npm install
cd ..
```

---

## 4. Running the Application

TerraSense IQ can be operated in two distinct modes depending on your workflow:

### Mode A: Production Integrated Build (Recommended)
In this mode, Vite compiles the React SPA into static assets inside `frontend/dist/`. The Flask backend serves both the REST API on `/api/*` and the compiled SPA on `/`.

1. **Build the React Frontend:**
   ```powershell
   cd frontend
   npm run build
   cd ..
   ```
   *This outputs optimized CSS and JS bundles to `frontend/dist/`.*

2. **Launch the Flask Server:**
   ```powershell
   python app.py
   ```
   *Expected console output:*
   ```text
    * Serving Flask app 'irrigation'
    * Running on all addresses (0.0.0.0)
    * Running on http://127.0.0.1:5000
   ```

3. **Open the Application:**  
   Navigate in your browser to:  
   👉 **`http://127.0.0.1:5000/`**

---

### Mode B: Frontend Development Mode (Hot Reloading)
In this mode, Flask runs the backend API while Vite runs a local development server with instant Hot Module Replacement (HMR).

1. **Terminal 1 (Flask API):**
   ```powershell
   cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system"
   .\.venv\Scripts\Activate.ps1
   python app.py
   ```
   *Flask listens on port 5000.*

2. **Terminal 2 (Vite Dev Server):**
   ```powershell
   cd "C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system\frontend"
   npm run dev
   ```
   *Vite listens on port 5173.*

3. **Open the Application:**  
   Navigate in your browser to:  
   👉 **`http://localhost:5173/`**  
   *All API requests to `/api/*` and `/reset-demo` are automatically proxied to `http://127.0.0.1:5000` via `vite.config.js`.*

---

## 5. Automated Testing & Verification

### Running Backend Tests (pytest)
TerraSense IQ includes a comprehensive test suite with 24 automated tests covering:
- Dual-threshold hysteresis state transitions.
- Boundary condition evaluations ($M = 35.0\%$, $M = 45.0\%$).
- Manual operator mode overrides.
- Parameter validation ($T_{wet} > T_{dry}$, $0 \le M \le 100$).
- Targeted clear history operations (readings vs. events).
- SPA client route resolution for all 7 application pages.

Execute the test suite from the project root:
```powershell
.\.venv\Scripts\python -m pytest
```

*Expected output:*
```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.3.2, pluggy-1.7.0
rootdir: C:\Users\dines\OneDrive\Desktop\Smart-irrigation-system
collected 24 items

tests\test_api.py .......                                                [ 29%]
tests\test_controller.py ...............                                 [ 91%]
tests\test_database.py ..                                                [100%]

============================= 24 passed in 2.50s ==============================
```

---

### Running Frontend Linting (oxlint)
To verify syntax, React Compiler purity rules, and unused imports:
```powershell
cd frontend
npm run lint
cd ..
```

---

## 6. Database Operations & Management

The platform utilizes a local SQLite database file named [`irrigation.db`](file:///c:/Users/dines/OneDrive/Desktop/Smart-irrigation-system/irrigation.db).

### Schema Tables
1. **`sensor_readings`**: Stores chronological telemetry snapshots:
   - `id`: Auto-incrementing primary key.
   - `device_id`: Device identifier (e.g., `simulated-device`).
   - `soil_moisture`: Numeric moisture percentage (0.0–100.0).
   - `raw_adc`: Simulated 12-bit ADC value.
   - `soil_status`: Classified condition (`DRY`, `TRANSITION`, `ADEQUATE`).
   - `pump_status`: State of actuator (`ON` or `OFF`).
   - `operating_mode`: Mode active during ingestion (`AUTOMATIC` or `MANUAL`).
   - `source`: Telemetry origin (e.g., `virtual_field_lab`, `dashboard_slider`).
   - `timestamp`: ISO-8601 UTC timestamp.
2. **`irrigation_events`**: Audit log of discrete controller state transitions:
   - `id`: Auto-incrementing primary key.
   - `event_type`: Event category (`pump_on`, `pump_off`, `mode_changed`, etc.).
   - `description`: Human-readable summary.
   - `moisture_value`: Soil moisture at the time of the event.
   - `operating_mode`: Mode active when the event was generated.
   - `source`: Initiator of the event.
   - `timestamp`: ISO-8601 UTC timestamp.
3. **`settings`**: Persistent configuration singleton (`id = 1`):
   - `dry_threshold`: Lower trigger threshold ($T_{dry}$, default 35.0%).
   - `wet_threshold`: Upper target threshold ($T_{wet}$, default 45.0%).
   - `current_mode`: Authoritative operating mode (`AUTOMATIC` or `MANUAL`).
   - `reading_interval`: Simulation loop interval in seconds.
   - `stale_data_seconds`: Timeout threshold for freshness warnings (30.0s).
   - `updated_at`: Last modification timestamp.

---

### Resetting to Factory Baseline
If you wish to wipe test records and restore clean demonstration defaults:
- **Via Web Interface:** Click the **"Reset Demo"** button in the sidebar footer or topbar header and confirm in the dialog.
- **Via HTTP GET:**  
  `http://127.0.0.1:5000/reset-demo`

---

## 7. REST API Quick Reference

| Endpoint | Method | Payload Example | Description |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | — | Returns current moisture, thresholds, pump status, and mode |
| `/api/readings` | `GET` | `?limit=50&source=...` | Returns filtered chronological sensor readings |
| `/api/events` | `GET` | `?limit=50&event_type=...` | Returns audited irrigation controller events |
| `/api/simulate` | `POST` | `{"moisture": 22.0, "source": "lab"}` | Ingests simulated moisture and triggers decision cycle |
| `/api/control` | `POST` | `{"command": "ON"}` | Sets pump state in MANUAL mode (`"ON"` or `"OFF"`) |
| `/api/mode` | `POST` | `{"mode": "AUTOMATIC"}` | Switches operating mode (`"AUTOMATIC"` or `"MANUAL"`) |
| `/api/settings` | `POST` | `{"dry_threshold": 30.0, "wet_threshold": 50.0}` | Updates and persists hysteresis thresholds |
| `/api/history/clear` | `POST` | `{"target": "all"}` | Purges history records (`"all"`, `"readings"`, `"events"`) |
| `/api/health` | `GET` | — | Returns operational health status `{"status": "ok"}` |
| `/reset-demo` | `GET` | — | Restores SQLite database to factory demonstration baseline |

---

## 8. Troubleshooting & FAQ

### Q1: `Unable to connect to the remote server` or port conflict?
- **Cause:** Another process is already running on port 5000 or 5173.
- **Fix:** Check active ports in PowerShell:
  ```powershell
  netstat -ano | findstr ":5000 :5173"
  ```
  Terminate the lingering process via Task Manager or `Stop-Process -Id <PID> -Force`.

---

### Q2: `ModuleNotFoundError: No module named 'flask'`?
- **Cause:** Python is running outside the virtual environment.
- **Fix:** Ensure `.venv` is activated:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  python -m pip install -r requirements.txt
  ```

---

### Q3: `sqlite3.OperationalError: no such table: settings`?
- **Cause:** Database file was created without initializing tables.
- **Fix:** Run the database initialization routine:
  ```powershell
  .\.venv\Scripts\python -c "from irrigation.database import init_db; init_db()"
  ```

---

### Q4: Changes in frontend code do not appear when loading `http://127.0.0.1:5000/`?
- **Cause:** Flask serves the pre-compiled bundle from `frontend/dist/`.
- **Fix:** Rebuild the frontend bundle:
  ```powershell
  cd frontend
  npm run build
  cd ..
  ```
  Or access the live hot-reloading dev server on `http://localhost:5173/`.
