# ☢️ Web-based NPP Simulator (Prototype)

> **"Experience nuclear power plant accident response directly in your web browser."**

This project is a prototype that allows users to simulate a **Loss of Feedwater (LOFW)** scenario in a nuclear power plant directly on the web. Without installing complex software, anyone can test emergency response procedures using just a link.

---

## 🎯 Project Purpose (Why?)

1. **No Installation Required:** Runs anywhere with a modern web browser like Chrome or Safari. No EXE installation needed.
2. **Accident Response Training:** Tests key operator actions during an emergency Loss of Feedwater (LOFW) event.
3. **Data-Driven Analysis:** Records user actions for analysis to improve response procedures and enable AI-assisted advisory systems.

---

## 🕹️ User Guide (How to Play)

When the simulator starts, an accident is **automatically triggered after about 5 seconds**. Stay calm and respond by monitoring the panels below.

### Screen Layout (4-Panel View)

| Location         | Panel Name        | Role                                                                                                                         |
| :--------------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Top Left**     | **Status Panel**  | The **"instrument panel"**. Displays water level, pressure, alarms, and plant status. Red indicators signal problems.        |
| **Bottom Left**  | **Control Panel** | The **"control interface"**. Operate valves (sliders), toggle pumps (buttons), or trip the reactor.                          |
| **Top Right**    | **AI Advisor**    | The **"assistant"**. Ask questions like "What is happening now?" or "What should I do?" to receive procedure-based guidance. |
| **Bottom Right** | **Procedures**    | The **"map"**. Visualizes the current step within the emergency operating procedure using a graph.                           |

### Scenario Presets

The Scenario Selector is located in the **Footer** of the Control Panel (Bottom Left). Note: It is only visible when **Training Mode** is toggled **ON** (Green). If Training Mode is OFF (Gray), the system defaults to Scenario C for evaluation.

*   **A: CV Issue (Easy)**
    *   **Event:** The Feedwater Control Valve (FWCV) fails and drifts closed.
    *   **Goal:** Restore flow by switching FWCV to **Manual** and opening it.
*   **B: Pump Issue (Medium)**
    *   **Event:** The Main Feedwater Pump (FWP) trips offline.
    *   **Goal:** Restore flow by **Restarting** the Feedwater Pump.
*   **C: Hard Fail (Hard)**
    *   **Event:** A severe combined failure where flow restoration is impossible.
    *   **Goal:** Recognize the safety criteria (Low SG Level) and **Trip the Reactor** manually to stabilize the plant.

---

## 🛠️ Developer & Engineer Notes (Tech Stack)

This project is designed to be fast and lightweight using modern web technologies.

* **Frontend:** React (Vite)
* **Language:** TypeScript
* **Style:** Tailwind CSS (v4)
* **State Management:** Zustand
* **Visualization:** `react-force-graph-2d` (knowledge graph visualization)
* **AI Integration:** Google Gemini API (GraphRAG-based advisory)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server (http://localhost:5173)
npm run dev

# 3. Build for production
npm run build
```

> 💡 **Note:** For more detailed system architecture, see [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md). For logic details, see [`SCENARIO_LOGIC.md`](./SCENARIO_LOGIC.md).
