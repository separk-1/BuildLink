# ☢️ Web-based NPP Simulator (Prototype)

> **"Experience nuclear power plant accident response directly in your web browser."**

This project is a research prototype designed to simulate a **Loss of Feedwater (LOFW)** scenario in a nuclear power plant. It provides an accessible, web-based platform for testing emergency operating procedures (EOPs) and analyzing operator decision-making processes without requiring complex software installations.

---

## 🎯 Project Philosophy: "Visualizing the Procedure, Not Automating It"

The core innovation of this simulator lies in its **Knowledge Graph-based Procedure Visualization**. Unlike traditional systems that might automate procedure steps based on plant state, this system acts as a **dynamic map** for the operator.

### Design Principles
*   **Node (What):** Represents the entity involved (Valve, Pump, Gauge).
*   **Edge (How):** Represents the procedural action or logic (Verify, Check, Next).
*   **Highlight (Where):** Visualizes the **currently active procedural path**.

### Why Operator-Driven?
The goal is to visualize **what the operator should do**, not just **what the plant is doing**.
*   **Verify Steps:** The system does not auto-advance when a value is met. The operator must *check* the value and explicitly *confirm* the verification. This mimics the "stop-and-verify" safety protocol.
*   **Check-If (Decision) Steps:** The system highlights the decision point but does not auto-branch. The operator must *evaluate* the condition and *choose* the path (True/False). This preserves the critical role of human judgment in emergency response.

---

## 🕹️ User Guide

When the simulator starts, an accident is **automatically triggered after 10 seconds**. Stay calm and follow the procedure.

### Screen Layout (4-Panel View)

| Location         | Panel Name        | Role                                                                                                                         |
| :--------------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Top Left**     | **Status Panel**  | The **"Plant State"**. Displays real-time data (Level, Pressure, Flow) and alarms.                                           |
| **Bottom Left**  | **Control Panel** | The **"Cockpit"**. Operate valves, pumps, and trip systems. Toggle Incident View and Scenarios here.                         |
| **Top Right**    | **AI Advisor**    | The **"Co-Pilot"**. A RAG-based AI assistant that answers questions about plant status and procedures.                       |
| **Bottom Right** | **Procedures**    | The **"Map"**. A Force-Directed Graph showing the EOP. Follow the highlighted path and use the buttons to navigate.          |

### Scenario Presets

The Scenario Selector is located in the **Footer** of the Control Panel.

*   **Scenario A (CV Issue):** Feedwater Control Valve drift. Fix by switching to Manual.
*   **Scenario B (Pump Issue):** Feedwater Pump trip. Fix by restarting the pump.
*   **Scenario C (Hard Fail):** Total Loss of Feedwater. Requires Emergency Reactor Trip (Feed & Bleed).

> **Note:** "Training Mode" adds stochastic noise and randomness to the simulation to test robustness.

---

## 🛠️ Technical Architecture

This project leverages a modern web stack to deliver high-performance simulation and visualization.

*   **Frontend:** React 19 (Vite), TypeScript
*   **Styling:** Tailwind CSS v4
*   **State Management:** Zustand (Physics Engine & Store)
*   **Visualization:** `react-force-graph-2d` (Canvas-based rendering)
*   **AI Integration:** Google Gemini API with GraphRAG context

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server (http://localhost:5173)
npm run dev

# 3. Build for production
npm run build
```

---

## 📚 Documentation
For deeper insights into the system logic:
*   [`STEP_LOGIC.md`](./STEP_LOGIC.md): Detailed explanation of the Operator-Driven procedure flow.
*   [`SCENARIO_LOGIC.md`](./SCENARIO_LOGIC.md): Physics equations and scenario definitions.
*   [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md): High-level architectural diagrams and component breakdown.
