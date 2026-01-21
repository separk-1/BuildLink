# NPP Web Simulator (LOFW Prototype)

![Design Reference](./design_reference.png)

## 1. Project Context & Objectives
**Goal:** Develop a **Web-based Nuclear Power Plant (NPP) Simulator Prototype** for the **Loss of Feedwater (LOFW)** scenario.

**Why Web-Based?**
- To facilitate easy testing and feedback from industry partners and decision-makers without the friction of installing executable software.
- If the prototype is successful, it can be expanded into a full-scale web or desktop application.

**Design Decision: Custom Panel vs. RANCOR**
- We decided **not** to use the RANCOR system directly because:
    1.  It is complex and proprietary.
    2.  We need a generalized, simplified interface for testing specific scenarios.
- Instead, we are building a custom **4-panel interface** focusing only on the elements relevant to LOFW.

---

## 2. Implementation Plan (MVP)
This project follows a rapid prototyping schedule:

- **Day 1: Layout & Controls**
    - [x] Implement 4-panel grid layout.
    - [x] Create static Status Panel (P&ID) and Control Panel UI.
    - [x] Implement interactive toggles and sliders (UI only).
- **Day 2: Physics & Dynamics**
    - [x] Implement "Fake Physics" loop (10Hz).
    - [x] Model Feedwater Flow dynamics (`fw_flow` logic).
    - [x] Model SG Level response to flow and steam output.
    - [x] Implement Alarm thresholds (e.g., `FW LOW FLOW`).
- **Day 3: Logging & Data**
    - [x] Implement Event Logging (Operator actions).
    - [x] Implement State Snapshots (1Hz data capture).
    - [ ] Generate Incident Report (JSON export ready).

---

## 3. System Architecture

- **Frontend:** React + Vite (Fast prototyping).
- **State Management:** Zustand (Physics loop and global state).
- **Backend:** Python (FastAPI) - *Optional for MVP, setup included for future data storage.*

### Screen Layout (4-Split)
1.  **Top-Left: Status/Display Panel** (Read-only)
    -   System schematic with dynamic flow coloring.
    -   Key Gauges: `fw_flow`, `sg_level`, `sg_pressure`, `reactor_power`.
    -   Alarm Tiles (e.g., FW LOW FLOW, SG LOW LEVEL).
2.  **Bottom-Left: Control Panel** (Operator Inputs)
    -   **Toggles:** FW Pump, FW Isolation Valve, Main Steam IV.
    -   **Control:** FW Control Valve (Slider 0-100%).
    -   **Trips:** Reactor Trip, Turbine Trip.
3.  **Top-Right: AI Advisor** (Placeholder)
    -   Space reserved for future LLM-based decision support.
4.  **Bottom-Right: Procedure/Knowledge Graph** (Placeholder)
    -   Space reserved for digitized procedures and regulation checks.

---

## 4. Simulation Logic ("Fake Physics")
The simulation prioritizes **operator decision-making fidelity** over engineering precision.

### Key Equations (Simplified)
- **Feedwater Flow:**
  `fw_flow = k * pump_on * iv_open * cv_pos * (1 - malfunction_severity)`
- **SG Level:**
  `d(sg_level) = (fw_flow - steam_out) * scale_factor`
- **Steam Out:**
  Proportional to `reactor_power`. Drops to 0 if MSIV is closed.

### Key Variables
| Variable | Unit | Description |
| :--- | :--- | :--- |
| `fw_flow` | kg/s | Feedwater flow rate. |
| `sg_level` | % | Steam Generator water level (Main control target). |
| `sg_pressure` | MPa | Steam pressure. |
| `reactor_power`| % | Core power. |
| `turbine_speed`| rpm | Turbine speed. |

---

## 5. Logging & Analysis
Crucial for analyzing human error and procedure compliance.

1.  **Event Logs:** Records discrete actions (e.g., `SET_FW_CV 0.65`, `TOGGLE_PUMP`).
2.  **State Snapshots:** 1Hz dumps of all system variables.
3.  **Future Work:**
    -   Integration with Knowledge Graph for automated incident analysis.
    -   Comparison against standard operating procedures.

---

## 6. Setup & Run

### Frontend (Simulator)
```bash
npm install
npm run dev
```

### Backend (Optional / Future)
```bash
# Requires Python 3.8+
pip install -r requirements.txt
python3 setup.py install
```
