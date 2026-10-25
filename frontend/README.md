# TerraSense IQ — Frontend Architecture

This is the React 19 single-page application (SPA) client for **TerraSense IQ** (Smart Agriculture Monitoring Platform), built using Vite, Recharts, Lucide React, and React Router.

---

## 🏗️ Architecture & Component Hierarchy

```text
src/
├── api/
│   └── client.js             # Centralized fetch API client with error mapping
├── components/
│   ├── ConfirmationModal.jsx # Accessible destructive confirmation modal
│   ├── Layout.jsx            # Shell with sidebar, topbar, theme switcher & toasts
│   ├── MetricCard.jsx        # Standardized KPI card with status indicators
│   ├── SimulationBanner.jsx  # Academic/simulation environment disclosure
│   └── VirtualPlantAnimation.jsx # SVG digital twin plant & drip irrigation model
├── context/
│   └── SystemContext.jsx     # Global state provider, polling engine & action hooks
├── pages/
│   ├── Overview.jsx          # Overview KPI cards, fixed Recharts history, & quick sim
│   ├── LiveMonitoring.jsx    # Real-time telemetry feed with freshness indicators
│   ├── SimulationLab.jsx     # 7-stage interactive pipeline & digital twin lab
│   ├── History.jsx           # Analytics charts, multi-parameter filters & CSV export
│   ├── Events.jsx            # Chronological controller transition audit log
│   ├── Settings.jsx          # Dual-threshold hysteresis configuration & theme setup
│   └── SystemInfo.jsx        # System architecture, mathematical model & diagnostics
├── index.css                 # TerraSense IQ design tokens, components & utilities
├── App.jsx                   # React Router route registry
└── main.jsx                  # Application entry point
```

---

## 🎨 Visual Design System Tokens

The frontend uses a refined light theme by default (with dark theme support) driven by design tokens in `index.css`:

- `--ts-primary`: `#176B4D` (Forest Green)
- `--ts-secondary`: `#2E8B62` (Secondary Green)
- `--ts-bg-subtle-green`: `#EAF5EF` (Subtle Badge & Highlight Green)
- `--ts-text-primary`: `#18241F` (Primary High-Contrast Text)
- `--ts-text-secondary`: `#68756E` (Secondary Muted Text)
- `--ts-bg-app`: `#F5F7F5` (Application Canvas)
- `--ts-surface`: `#FFFFFF` (Card & Panel Surface)
- `--ts-border`: `#E2E8E3` (Standard Structural Borders)
- `--ts-info`: `#2878C7` (Actuator & Telemetry Blue)
- `--ts-warning`: `#B7791F` (Hysteresis Transition Amber)
- `--ts-error`: `#C64545` (Dry Trigger Threshold Red)

---

## 🚀 Development Scripts

```powershell
# Start Vite development server with HMR on port 5173:
npm run dev

# Build production bundle into dist/:
npm run build

# Run Oxlint code analysis:
npm run lint

# Preview local production build:
npm run preview
```
