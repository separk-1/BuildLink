# NPP Web Simulator (LOFW Prototype)

## 1. Project Overview
This project is a **web-based Nuclear Power Plant (NPP) simulator prototype** designed to simulate a **Loss of Feedwater (LOFW)** scenario.

The primary goal is to provide a lightweight, accessible platform for industry partners and decision-makers to test the system without the need for executable installations. The simulator focuses on capturing operator decision-making processes through detailed logging, which will facilitate future analysis using Knowledge Graphs and AI.

**Key Design Philosophy:**
- **Web-First:** Accessibility for testing and demonstration.
- **MVP Scope:** Focused strictly on the LOFW scenario (Loss of Feedwater).
- **Simplified Physics:** Uses a "training-grade" dynamic model (simplified differential equations) rather than high-fidelity engineering simulations, focusing on decision points.
- **Data-Driven:** Comprehensive logging of operator actions and system states for post-analysis.

---

## 2. System Architecture

The project is built as a Single Page Application (SPA) to ensure responsiveness and ease of deployment.

- **Frontend:** React.js
- **State Management:** Zustand (for managing physics state and simulation clock)
- **Visualization:** Canvas API / SVG for P&ID (Piping and Instrumentation Diagram)
- **Deployment:** Static web hosting (e.g., Vercel, Netlify)

### Screen Layout (4-Split)
1.  **Top-Left: Status/Display Panel** (Read-only)
    -   System schematic (P&ID).
    -   Key Gauges: FW Flow, SG Level, SG Pressure, Rx Power, Turbine Speed.
    -   Alarm Tiles.
2.  **Bottom-Left: Control Panel** (Operator Inputs)
    -   **Toggles:** FW Pump (ON/OFF), FW Isolation Valve, Main Steam IV.
    -   **Sliders/Knobs:** FW Control Valve (0-100%).
    -   **Buttons:** Manual Reactor Trip, Turbine Trip.
3.  **Top-Right: AI Advisor** (Placeholder for MVP)
    -   Future integration for LLM-based decision support.
4.  **Bottom-Right: Procedure/Knowledge Graph** (Placeholder for MVP)
    -   Static procedure display for LOFW.

---

## 3. Simulation Logic (Physics Engine)

The simulation runs on a client-side tick (e.g., 10Hz). It models the interaction between the Feedwater System and the Steam Generator.

### Key State Variables
| Variable | Unit | Description |
| :--- | :--- | :--- |
| `fw_flow` | kg/s | Feedwater flow rate into the Steam Generator. |
| `sg_level` | % | Water level in the Steam Generator (Critical control parameter). |
| `sg_pressure` | MPa | Steam pressure. |
| `reactor_power`| % | Core thermal power. |
| `turbine_speed`| rpm | Turbine rotation speed. |

### Control Inputs
- `fw_pump_on` (Boolean)
- `fw_cv_position` (Float 0.0 - 1.0)
- `fw_iv_open` (Boolean)
- `msiv_open` (Boolean)
- `reactor_trip` (Boolean)

### Failure Mode: Loss of Feedwater (LOFW)
The simulator introduces faults (e.g., valve failure or pump trip) that degrade `fw_flow`. The operator must detect the anomaly via alarms (`FW LOW FLOW`, `SG LOW LEVEL`) and execute the rapid shutdown (Trip) procedure if automatic controls fail.

---

## 4. Logging & Data Analysis

To support the research goal of analyzing operator errors and procedure compliance, the system records two types of logs:

1.  **Event Logs:** Records discrete operator actions.
    -   Format: `{ timestamp, action_type, target_component, value }`
    -   Example: `[10:05:21] ACTION: SET_FW_CV value=0.65`
2.  **State Snapshots:** Periodic records of system physics (1Hz).
    -   Format: `{ timestamp, fw_flow, sg_level, sg_pressure, alarms_active }`

*MVP implementation allows downloading these logs as a JSON file.*

---

## 5. Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project Setup (React + Vite).
- [x] Basic Layout Implementation (4-panel grid).
- [x] "Fake Physics" Loop Implementation.

### Phase 2: Core Features
- [x] Interactive Control Panel (Sliders, Toggles).
- [x] Dynamic Visualization (Gauges, Flow lines changing color).
- [x] Alarm Logic Implementation.

### Phase 3: Data & Refinement
- [x] Logging System (JSON Export).
- [ ] Incident Report Generation.
- [ ] UI Polish for deployment.

---

## 6. Setup & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
