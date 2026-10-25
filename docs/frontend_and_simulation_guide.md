# TerraSense IQ — Complete Frontend & Simulation Architecture Specification

> **Platform:** TerraSense IQ  
> **Tagline:** Intelligent Irrigation. Data-Driven Agriculture.  
> **Category:** Smart Agriculture Monitoring Platform  
> **Primary Module:** Intelligent Irrigation Control  
> **Simulation Module:** Virtual Field Lab  
> **Architecture:** Decoupled React 19 SPA + Python/Flask REST API + SQLite Relational Engine

---

## 1. Executive Summary & Simulation-First Paradigm

### 1.1 The Simulation-First Philosophy
**TerraSense IQ** is an industrial-grade smart agriculture monitoring and decision platform designed around a **simulation-first paradigm**. 

In conventional IoT and agricultural engineering projects, physical hardware dependencies (microcontrollers, capacitive soil probes, 5V relays, water pumps, plumbing) introduce mechanical failure points, inconsistent demonstration environments, and electrical hazards during software development. 

TerraSense IQ resolves this by implementing a **complete software-driven digital twin** and mathematical simulation pipeline. The application models the entire physical process:
- Soil moisture dynamics (absorption, root uptake, evaporation).
- 12-bit analog-to-digital sensor conversion (MCP3008 / ADC modeling).
- Microcontroller telemetry serialization (ESP32 firmware emulation).
- Closed-loop dual-threshold hysteresis decision algorithms.
- Virtual actuator relay states (submersible pump ON/OFF).
- Chronological historical telemetry analytics and audit event logs.

### 1.2 Hardware Transparency & Technical Credibility
The platform maintains strict integrity regarding physical hardware connectivity:
- The system **never** displays misleading "Connected" claims for non-existent physical microcontrollers or pumps.
- All telemetry, charts, and animations are clearly marked with subtle simulation environment badges:  
  `"Simulation environment · No physical hardware connected"`.
- The physical deployment architecture (Raspberry Pi 4, MCP3008 ADC, Capacitive Soil Probe v1.2, 5V optocoupler relay) is documented as an **intended target hardware roadmap** rather than an existing physical connection.

---

## 2. Frontend Engineering Architecture

### 2.1 Technology Stack
The frontend is constructed using modern, high-performance web technologies:

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime & Core** | React.js | `^19.3.1` | Concurrent component rendering and declarative UI |
| **DOM Renderer** | React DOM | `^19.3.1` | Browser DOM reconciliation |
| **Build & Bundler** | Vite | `^8.3.4` | Sub-second HMR and production Rolldown bundling |
| **Routing** | React Router DOM | `^7.18.4` | Single-page client-side navigation with route history |
| **Data Visualization** | Recharts | `^2.15.1` | Composable SVG time-series charts with responsive wrappers |
| **Interface Icons** | Lucide React | `^1.61.0` | Accessible SVG icon library |
| **Linting & Code Quality** | Oxlint | `^1.88.0` | High-speed Rust-based JavaScript/React linter |

---

### 2.2 Component Hierarchy & Directory Organization

```text
frontend/src/
├── api/
│   └── client.js             # Centralized HTTP client with query builders and error mapping
├── components/
│   ├── ConfirmationModal.jsx # Accessible modal with focus trap for destructive actions
│   ├── Layout.jsx            # Application shell (sidebar navigation, topbar, theme switcher, toast hub)
│   ├── MetricCard.jsx        # Standardized KPI card with icon, status badge, and trend footer
│   ├── SimulationBanner.jsx  # Prominent, honest simulation environment notification
│   └── VirtualPlantAnimation.jsx # Custom SVG digital twin illustrating plant, soil, and drip pipe
├── context/
│   └── SystemContext.jsx     # Shared state bus: status, thresholds, mode, polling loop, and toasts
├── pages/
│   ├── Overview.jsx          # Executive dashboard: 4 core questions, fixed Recharts chart, quick slider
│   ├── LiveMonitoring.jsx    # Real-time telemetry feed, freshness indicator, virtual ADC readings
│   ├── SimulationLab.jsx     # 7-stage interactive pipeline, scenario presets, plant animation
│   ├── History.jsx           # Analytics charts, multi-parameter filtering, CSV export, clear history
│   ├── Events.jsx            # Chronological controller transition audit log with type filters
│   ├── Settings.jsx          # Configuration: validated dual thresholds, deadband preview, theme setup
│   └── SystemInfo.jsx        # System architecture, mathematical hysteresis proof, health diagnostics
├── index.css                 # Comprehensive TerraSense IQ design system and layout rules
├── App.jsx                   # Central route registry (7 primary routes + aliases)
└── main.jsx                  # React application mount entry point
```

---

### 2.3 Global State Management & SystemContext Bus
State synchronization across pages is handled via `SystemContext.jsx` ([`frontend/src/context/SystemContext.jsx`](file:///c:/Users/dines/OneDrive/Desktop/Smart-irrigation-system/frontend/src/context/SystemContext.jsx)), providing a single source of truth:

```javascript
// State shape managed in SystemContext:
{
  status: {
    moisture: 42.5,
    soil_status: "TRANSITION",        // "DRY" | "TRANSITION" | "ADEQUATE"
    pump_status: "ON",                // "ON" | "OFF"
    mode: "AUTOMATIC",                // "AUTOMATIC" | "MANUAL"
    dry_threshold: 35.0,              // T_dry
    wet_threshold: 45.0,              // T_wet
    connection_status: "SIMULATED",   // Never misleading "CONNECTED"
    data_source: "virtual_field_lab", // Originating simulation source
    last_updated: "2026-10-24T14:45:00.000Z",
    reading_timestamp: "2026-10-24T14:45:00.000Z"
  },
  pollingActive: true,                // Stream running or paused
  pollIntervalMs: 3000,               // 1000 | 3000 | 5000 | 10000 ms
  refreshTrigger: 0,                  // Increment counter triggering page re-fetches
  notifications: []                   // Active toast notifications
}
```

#### Shared Context Operations
- `fetchStatus()`: Queries `GET /api/status` to synchronize thresholds, mode, and pump status.
- `simulateMoisture(value, source)`: Ingests a new soil moisture level via `POST /api/simulate`, executes the hysteresis state machine on the backend, updates local state, and increments `refreshTrigger`.
- `switchMode(mode)`: Dispatches `POST /api/mode` to toggle between `AUTOMATIC` and `MANUAL` operating modes.
- `controlPump(command)`: Dispatches `POST /api/control` to command `ON` or `OFF` during manual operator override.
- `updateThresholds(dry, wet)`: Validates and saves new hysteresis parameters via `POST /api/settings`.
- `clearHistory(target)`: Safely purges `readings`, `events`, or `all` records via `POST /api/history/clear` without deleting system configuration.

---

## 3. Visual Design System & Design Tokens

### 3.1 Color Palette & Token Catalog
The interface uses a refined light theme by default, constructed with CSS custom properties in `index.css`:

```css
:root {
  /* Brand Palette */
  --ts-primary: #176B4D;          /* Primary forest green */
  --ts-primary-hover: #12543C;
  --ts-primary-active: #0E4230;
  --ts-secondary: #2E8B62;        /* Secondary agricultural green */
  --ts-bg-subtle-green: #EAF5EF;  /* Subtle green accent canvas */
  --ts-border-green: #C2E2D0;

  /* Surfaces & Typography */
  --ts-text-primary: #18241F;     /* High-contrast readable body text */
  --ts-text-secondary: #68756E;   /* Explanatory descriptions */
  --ts-text-muted: #8C9B93;       /* Metadata, units & timestamps */
  --ts-bg-app: #F5F7F5;           /* Application canvas */
  --ts-surface: #FFFFFF;          /* Card & panel surfaces */
  --ts-surface-muted: #EEF2EF;    /* Interactive muted controls */
  --ts-border: #E2E8E3;           /* Primary structural dividers */
  --ts-border-subtle: #EDF2EE;    /* Table & row dividers */

  /* Semantic Feedback */
  --ts-info: #2878C7;             /* Pump active & telemetry blue */
  --ts-info-bg: #EBF3FB;
  --ts-warning: #B7791F;          /* Hysteresis transition deadband amber */
  --ts-warning-bg: #FEF7EC;
  --ts-error: #C64545;            /* Dry threshold & alert red */
  --ts-error-bg: #FDF2F2;
}
```

### 3.2 Spacing, Typography & Elevation Scales
- **Typography:** `Inter`, -apple-system, sans-serif. Sizes range from `--text-xs` (`0.75rem` / 12px) to `--text-3xl` (`1.875rem` / 30px).
- **Spacing:** Micro-scale from `--space-1` (4px) to `--space-12` (48px).
- **Elevation:** Subdued multi-layer shadows (`--shadow-xs` to `--shadow-lg`) avoiding heavy or distracting neon drop shadows.
- **Accessibility:** Visible focus rings (`button:focus-visible { outline: 2px solid var(--ts-primary); }`), non-color status badges combining icons, dots, and labels, and `@media (prefers-reduced-motion: reduce)` support.

---

### 3.3 Root Cause Analysis & Permanent Chart Layout Fix

#### The Bug Mechanism
In previous implementations, `ResponsiveContainer` inside Flexbox and CSS Grid layouts frequently calculated a width of 0, entered an infinite resize loop, or blew out horizontally past the viewport width.

**Cause:** Flex items have a CSS default of `min-width: auto`. When `ResponsiveContainer` attaches a `ResizeObserver` to its parent container, the unconstrained flex item expands to accommodate SVG content rather than constraining it.

#### The Architectural Solution
1. Constrained flex children in `index.css`:
   ```css
   .main-wrapper {
     flex: 1;
     margin-left: var(--sidebar-width);
     min-width: 0;   /* Prevents flex item from expanding beyond screen */
     width: calc(100% - var(--sidebar-width));
   }

   .content-body {
     max-width: 1440px;
     width: 100%;
     min-width: 0;   /* Crucial for chart resize observers */
   }

   .chart-container-wrapper {
     width: 100%;
     min-width: 0;
     height: 340px;
     position: relative;
   }
   ```
2. In Recharts, configured `debounce={50}` and `minWidth={0}` to allow the browser to complete layout passes before computing SVG coordinates.
3. Sorted all series chronologically ascending (`[...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))`), eliminating timestamp overlap and zigzag line artifacts.

---

## 4. Detailed Module Specifications

### 4.1 Module 1: Overview Dashboard (`/`)
The Overview dashboard answers four core agricultural questions:
1. **What is the current soil condition?** &rarr; Simulated moisture percentage, soil classification (`DRY`, `TRANSITION`, `ADEQUATE`), and delta trend against previous readings.
2. **What is the irrigation controller doing?** &rarr; Virtual pump state (`ON` / `OFF`), relay actuation indicator, and mode indicator.
3. **Why did it make that decision?** &rarr; Dynamic decision banner synthesizing moisture levels, thresholds, and mode.
4. **How have readings changed over time?** &rarr; Responsive chronological line chart with Dry Trigger (`35%`) and Adequate Target (`45%`) reference lines.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SIMULATION BANNER: Academic & Software Simulation · No Physical Hardware    │
├───────────────┬───────────────┬─────────────────┬───────────────────────────┤
│ SOIL MOISTURE │ PUMP STATE    │ CONTROLLER MODE │ SIMULATION HEALTH         │
│    22.0%      │      ON       │    AUTOMATIC    │      ONLINE               │
│ [Dry Soil]    │ [Pump Active] │ [Hysteresis]    │ [Simulated Core]          │
├───────────────┴───────────────┴─────────────────┴───────────────────────────┤
│ CURRENT DECISION: Moisture (22%) is below dry threshold (35%).              │
│                   Automatic irrigation commanded pump ON.                   │
├────────────────────────────────────────┬────────────────────────────────────┤
│ QUICK MOISTURE INJECTION               │ HYSTERESIS DECISION MODEL          │
│ Slider: [=====O===========] 22%        │ Dry Trigger: 35% (Pump ON)         │
│ Presets: [22%] [40%] [55%] [80%]       │ Adequate Target: 45% (Pump OFF)    │
│ Mode: [Auto] [Manual]  Pump: [ON] [OFF]│ Deadband: 35%-45% (Retains state)  │
├────────────────────────────────────────┴────────────────────────────────────┤
│ SOIL MOISTURE HISTORY TREND (Responsive Recharts Container)                 │
│ 100% ┼───────────────────────────────────────────────────────────────────── │
│      │                                                                      │
│  45% ┼─ - - - - - - - - Adequate Target Line (Green) - - - - - - - - - - - -│
│  35% ┼─ - - - - - - - - Dry Trigger Line (Red) - - - - - - - - - - - - - - -│
│   0% ┼───●──────●──────────●──────────●──────────────────────────────────── │
│      14:10     14:15      14:20      14:25                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Module 2: Live Monitoring (`/monitoring`)
Focused real-time telemetry stream:
- **Telemetry Freshness Counter:** Evaluates elapsed time since last sensor ingestion (`reading_timestamp`). Labeled as **Fresh Telemetry** (< 15s), **Nominal** (15–60s), or **Stale Data Warning** (> 60s).
- **Virtual 12-Bit ADC:** Computes modeled raw analog-to-digital counts based on simulated resistance:
  $$\text{ADC}_{\text{raw}} = \text{round}\left(4095 - \frac{\text{Moisture}}{100} \times 2600\right)$$
  Yielding ~4095 in bone-dry soil and ~1495 in fully saturated soil.
- **Stream Controls:** Polling rate selection (`1s`, `3s`, `5s`, `10s`) and stream Pause/Resume toggles.

---

### 4.3 Module 3: Virtual Field Lab (`/simulation`)
The primary simulation environment combining interactive controls with an animated digital twin.

#### A. 7-Stage Simulation Pipeline

```mermaid
flowchart LR
    S1[1. Virtual Soil Input\nMoisture: 0-100%] --> S2[2. Sensor Simulation\n12-Bit ADC: 1495-4095]
    S2 --> S3[3. ESP32 Logic Model\nFirmware Payload Validation]
    S3 --> S4[4. Moisture Interpretation\nState: DRY / TRANSITION / ADEQUATE]
    S4 --> S5[5. Decision Engine\nDual-Threshold Hysteresis]
    S5 --> S6[6. Virtual Pump State\nRelay Command: ON / OFF]
    S6 --> S7[7. Dashboard & History\nSQLite Relational Persistence]
```

- Each stage highlights sequentially during a simulated reading cycle.
- Clear distinction between **Active Software Simulation**, **Wokwi ESP32 Prototype**, and **Physical Hardware Roadmap**.

#### B. Botanical Digital Twin Plant & Irrigation Model
Implemented in clean SVG ([`frontend/src/components/VirtualPlantAnimation.jsx`](file:///c:/Users/dines/OneDrive/Desktop/Smart-irrigation-system/frontend/src/components/VirtualPlantAnimation.jsx)):
- **Water Reservoir Tank:** Visual storage vessel with volume indicators.
- **Pump Motor & Impeller:** Electric motor housing with spinning impeller animation (`transformOrigin: center; animation: spin 1.2s linear infinite`) active only when `pump_status === 'ON' && !isPaused`.
- **Drip Irrigation Line:** Delivery pipe featuring animated dashed water flow (`animation: dashFlow 0.8s linear infinite`) and water droplets irrigating the root zone.
- **Moisture-Reactive Foliage:** Leaves transition dynamically:
  - Dry soil ($< 35\%$): Wilted leaves with amber/stress tone (`#B7791F`).
  - Adequate moisture ($35\% - 70\%$): Thriving agricultural green (`#2E8B62`).
  - Saturated soil ($> 70\%$): Deep forest green (`#176B4D`).
- **Stratified Soil Profile:** Rendered topsoil and subsoil layers with root networks.

---

### 4.4 Module 4: History & Analytics (`/history`)
- **Multi-Parameter Filtering:** Query by time window (`1h`, `24h`, `today`, `all`), soil condition (`DRY`, `TRANSITION`, `ADEQUATE`), and telemetry source (`dashboard_simulation`, `virtual_field_lab`, `auto_field_cycle`, `wokwi_esp32`).
- **CSV Data Exporter:** Generates RFC 4180 compliant CSV files with headers: `ID`, `Timestamp`, `Device ID`, `Moisture (%)`, `Soil Condition`, `Pump Status`, `Operating Mode`, `Data Source`.
- **Clear History Dialog:** Destructive confirmation modal providing granular choices:
  1. Clear Both Readings & Events.
  2. Clear Sensor Readings Only.
  3. Clear Irrigation Events Only.
  *Guarantees zero loss of configuration, thresholds, or operating mode.*

---

### 4.5 Module 5: Irrigation Events (`/events`)
Audit trail tracking discrete controller transitions:
- Event types: `pump_on`, `pump_off`, `pump_manual`, `mode_changed`, `threshold_changed`, `system_reset`.
- Summary metrics: Pump Activations, Pump Deactivations, Mode Transitions, Total Logged Events.
- Avoids fabricated water-volume or cost-saving statistics.

---

### 4.6 Module 6: Configuration (`/settings`)
- Configures $T_{dry}$ (0% to 90%) and $T_{wet}$ (10% to 100%).
- **Strict Validation:** Enforces $T_{wet} > T_{dry}$ to guarantee a functional hysteresis deadband.
- **Visual Deadband Diagram:** Interactive horizontal bar previewing the Dry Zone, Deadband Band, and Adequate Zone in real time.
- Operating mode switcher (Automatic vs. Manual) and theme preference (Light vs. Dark).

---

### 4.7 Module 7: System Information (`/system-info`)
- Academic project specifications, institutional context, and technology stack.
- Mathematical hysteresis derivation and state transition logic.
- Operational diagnostics querying `/api/health` and database table record counts.
- Transparent limitations disclosure regarding the simulation scope.

---

## 5. Mathematical Formulation of the Hysteresis Decision Engine

### 5.1 The Actuator Chattering Phenomenon
In naïve single-threshold irrigation systems with trigger threshold $T$:
$$\text{Pump State} = \begin{cases} \text{ON} & \text{if } M < T \\ \text{OFF} & \text{if } M \ge T \end{cases}$$

When soil moisture hovers near $T$ (e.g., $40\%$), minor noise, root water movement, or ADC fluctuation causes the pump to switch on and off repeatedly within seconds. This rapid cycling ("relay chatter") causes mechanical wear, thermal stress, and contact welding on relays and motor windings.

---

### 5.2 The Dual-Threshold State Machine Formulation
TerraSense IQ employs a **closed-loop dual-threshold hysteresis model** parameterized by:
- $T_{dry}$: Lower trigger threshold (default $35.0\%$).
- $T_{wet}$: Upper cutoff threshold (default $45.0\%$).
- $\Delta = T_{wet} - T_{dry}$: Hysteresis deadband (default $10.0\%$).

Let $M_t$ be the measured soil moisture at time $t$, and $S_t \in \{\text{ON}, \text{OFF}\}$ be the virtual pump state. The state transition function $f(M_t, S_{t-1})$ is formulated as:

$$S_t = \begin{cases}
\text{ON} & \text{if } M_t < T_{dry} \\
\text{OFF} & \text{if } M_t \ge T_{wet} \\
S_{t-1} & \text{if } T_{dry} \le M_t < T_{wet} \quad (\text{Deadband Preservation})
\end{cases}$$

```text
       Pump State
           ▲
       ON  ┼──────────────┐
           │              │
           │              ▼ (Moisture rises past T_wet)
      OFF  ┼              └──────────────►
           └──────┬──────────────┬───────► Soil Moisture (M)
                T_dry          T_wet
                  ◄──────────────►
                     Deadband (Δ)
           (Moisture drops below T_dry)
```

---

## 6. Target Physical Hardware Reference Architecture

While TerraSense IQ operates as a simulation platform, the software architecture directly mirrors the physical hardware deployment design intended for field installation:

```text
┌────────────────────────────────────────────────────────┐
│            POWER SUPPLY & POWER REGULATION             │
│   12V DC Adapter ──► Relay Common (Pump Power)         │
│    5V DC Supply  ──► Raspberry Pi 4 USB-C Power        │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              RASPBERRY PI 4 MODEL B (SBC)              │
│  - Linux OS (Debian / Raspberry Pi OS)                 │
│  - Python Runtime hosting TerraSense IQ Controller     │
│  - SQLite Database Engine for Telemetry Persistence    │
│  - SPI Controller (/dev/spidev0.0)                     │
│  - GPIO Output Pin (Relay Control)                     │
└────────────────────────────────────────────────────────┘
          ▲                                    │
          │ SPI Bus (MISO/MOSI/SCLK/CE0)       │ GPIO High/Low
          │                                    ▼
┌───────────────────────┐            ┌───────────────────┐
│     MCP3008 ADC       │            │  5V OPTOCOUPLER   │
│  - 8-Channel 10-Bit   │            │   RELAY MODULE    │
│  - CH0: Sensor Analog │            │  - Optical Isol.  │
└───────────────────────┘            └───────────────────┘
          ▲                                    │
          │ Analog Voltage                     │ Switched 12V DC
          │ (1.2V to 3.0V)                     ▼
┌───────────────────────┐            ┌───────────────────┐
│   CAPACITIVE SOIL     │            │ 12V SUBMERSIBLE   │
│   MOISTURE PROBE      │            │ WATER PUMP        │
│  - Corrosion Resistant│            │  - Drip Manifold  │
└───────────────────────┘            └───────────────────┘
```
