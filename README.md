# NPP Web Simulator (LOFW Prototype)

![Design Reference](./design_reference.png)

## 1. Project Context & Objectives
**Goal:** Develop a **Web-based Nuclear Power Plant (NPP) Simulator Prototype** specifically for the **Loss of Feedwater (LOFW)** scenario.

### Why Web-Based? (2026-01-18 Context)
- **Accessibility:** We are building a prototype to be tested by various industry partners. Distributing an `.exe` file creates friction and security concerns for decision-makers.
- **Ease of Testing:** A web link allows immediate access for evaluation.
- **Scalability:** If adopted, the core logic can be ported to a desktop application or expanded as a full web platform.

### Design Philosophy
- **Simplified Interface:** We explicitly rejected using the RANCOR system directly.
- **Focus:** Loss of Feedwater (LOFW) scenario.
    - Cause: Automatic valve control failure or pump failure.
    - Resolution: Rapid shutdown (Reactor Trip) if manual control fails.

---

## 2. System Architecture

### Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + Zustand (State Management).
- **Visualization:** Canvas/SVG for the Plant Mimic.
- **Logging:** Client-side JSON generation (for Knowledge Graph research).

### Screen Layout (4-Split Design)
| Location | Component | Description |
| :--- | :--- | :--- |
| **Top-Left** | **Status/Display Panel** | **(Read-Only)** Simplified mimic. Shows FW Flow, SG Level, Reactor Power, Turbine Speed. |
| **Bottom-Left** | **Control Panel** | **(Interactive)** Operator controls (Toggles, Sliders, Buttons). |
| **Top-Right** | **AI Advisor** | *(Placeholder)* Future LLM-based decision support. |
| **Bottom-Right** | **Procedures** | *(Placeholder)* Interactive procedures/Knowledge Graph. |

---

## 3. Simulation Logic ("Fake Physics")
The physics model uses simplified ODEs running at **10Hz**.

### State Variables
- `fw_flow` (kg/s)
- `sg_level` (%)
- `sg_pressure` (MPa)
- `reactor_power` (%)
- `turbine_speed` (rpm)

### Controls (Inputs)
- **Toggles:**
  - `FW Pump` (ON/OFF)
  - `FW Isolation Valve` (OPEN/CLOSE)
  - `Main Steam Isolation Valve (MSIV)` (OPEN/CLOSE)
- **Sliders:**
  - `FW Control Valve` (0-100%)
- **Buttons:**
  - `TRIP REACTOR`
  - `TRIP TURBINE`

### Dynamics Equations
1.  **Feedwater Flow:**
    ```
    fw_flow = k * fw_pump_on * fw_iv_open * fw_cv_position * (1 - fault_severity)
    ```
2.  **Steam Generator Level:**
    ```
    d(level)/dt = a * fw_flow - b * steam_out
    ```
    *Note: `steam_out` is derived from reactor power and MSIV status.*

### Alarms
- `FW LOW FLOW`
- `SG LOW LEVEL`
- `RX OVER POWER`
- `HIGH ΔT`

---

## 4. Logging Requirement
Critical for building the dataset for the Knowledge Graph.

1.  **Event Logs:** User actions (e.g., `TOGGLE_PUMP`, `SET_FW_CV` `0.65`).
2.  **State Snapshots:** Recorded every **1 second (1Hz)** containing all state variables and active alarms.

---

## 5. How to Run
```bash
# Install dependencies
npm install

# Start Development Server
npm run dev
```
