# NPP Simulator System Overview

This document provides a detailed technical and operational overview of the **Web-based Nuclear Power Plant (NPP) Simulator Prototype**. It is designed to simulate a **Loss of Feedwater (LOFW)** scenario to facilitate operator training research, procedure analysis, and Knowledge Graph (KG) integration.

---

## 1. System Architecture

The simulator is built as a **Single Page Application (SPA)** using modern web technologies to ensure accessibility and ease of deployment.

### Core Stack
- **Frontend Framework**: **React** (v19) with **Vite** for fast development and build performance.
- **State Management**: **Zustand**. This acts as the "central nervous system," holding all simulation variables (pressures, flows, alarms) and driving the physics loop.
- **Styling**: **Tailwind CSS** (v4). We use a custom "Dark DCS" theme (Distributed Control System) to mimic actual power plant control interfaces (dark slate backgrounds, high-contrast alarms).
- **Visualization**: HTML5 **Canvas** is used for the interactive Knowledge Graph, and **SVG** is used for the Plant Mimic Diagram.

### 4-Split Panel Layout
The user interface is strictly divided into four functional areas to support the operator's cognitive workflow:

1.  **Status Panel (Top-Left)**: Read-only display. Contains the **Mimic Diagram** (visualizing flow paths) and the **Annunciator Grid** (alarm tiles).
2.  **Control Panel (Bottom-Left)**: Interactive area. Contains toggles, sliders, and trip buttons for the Reactor, Steam Generator (SG), and Turbine.
3.  **AI Advisor (Top-Right)**: A Chatbot interface powered by **Google Gemini**. It uses **GraphRAG** (Graph-Retrieval Augmented Generation) to answer questions based on the current plant state and procedures.
4.  **Procedure Panel (Bottom-Right)**: A dynamic visualization of the **Knowledge Graph**. It maps operational procedures into a network of steps, logic, and components.

---

## 2. Scenario: Loss of Feedwater (LOFW)

### Concept
The **Loss of Feedwater (LOFW)** is a critical event where the Steam Generator (SG) stops receiving water. Since the SG boils water to remove heat from the reactor, a loss of water leads to a drop in SG water level and a loss of "Heat Sink." If not resolved, the reactor must be tripped (shut down) to prevent overheating.

### Progression
1.  **Normal Operation**: Feedwater Flow matches Steam Flow. SG Level is stable at 50%.
2.  **Malfunction Trigger**:
    *   **Pump Failure**: The Main Feedwater Pump trips (stops).
    *   **Valve Failure**: The Feedwater Control Valve (CV) fails closed or loses automatic control.
3.  **Symptoms**:
    *   `FW FLOW` drops to zero.
    *   `FW LOW FLOW` alarm activates.
    *   `SG LEVEL` begins to decrease rapidly.
    *   `SG LOW LEVEL` alarm activates.
4.  **Operator Response (Procedure)**:
    *   Attempt to restore flow (Start standby pump, open valves).
    *   If flow cannot be restored, manually **Trip the Reactor** before the automatic safety systems engage.

---

## 3. Simulation Logic ("Fake Physics")

We utilize a simplified physics model ("Fake Physics") running at **10Hz** (10 updates per second). This model focuses on **causal relationships** and **operator decision points** rather than engineering-grade thermal hydraulics.

### Key Dynamics

#### 1. Feedwater Flow
Flow is determined by the "path of least resistance" and pump energy.
$$
Flow = k \times (\text{PumpStatus}) \times (\text{IsolationValve}) \times (\text{ControlValve\%})
$$
*If the pump is OFF or the Isolation Valve is CLOSED, Flow becomes 0 immediately.*

#### 2. Steam Generator Level
The SG behaves like a simple tank. The level changes based on the mass balance (Input - Output).
$$
\frac{d(\text{Level})}{dt} = \alpha \times (\text{FeedwaterFlow}) - \beta \times (\text{SteamOut})
$$
*   **FeedwaterFlow**: Adds water (increases level).
*   **SteamOut**: Removes water (decreases level). Steam Out is proportional to **Reactor Power**.

#### 3. Reactor Power & Trip
*   **Normal**: Power is 100%.
*   **Trip**: If the operator presses `TRIP REACTOR`, control rods drop (simulated). Power decays exponentially toward 0%.
*   **Effect**: As Power drops, `SteamOut` decreases, slowing the drop in SG Level.

### Noise Simulation
To make the simulator realistic for AI/Operator training, we add Gaussian noise to the "Display" variables.
*   **True State**: Used for physics calculations (smooth).
*   **Display State**: Used for UI gauges and graphs (jittery).

---

## 4. Operational Procedures & Knowledge Graph

We have digitized the standard operating procedure for LOFW into a **Knowledge Graph**. This graph is not just a static image; it is a data structure used by the system.

### Graph Structure
The graph consists of **Entities (Nodes)** and **Relationships (Edges)**:

*   **Nodes**:
    *   `PC_ST` (Procedure Step): e.g., "STEP 1", "STEP 2".
    *   `PC_LO` (Logic): e.g., "IF FW Flow < 500".
    *   `CT` (Component/Controller): e.g., "FW Pump Switch".
    *   `IC` (Indicator/Sensor): e.g., "FW Flow Meter".
*   **Edges**:
    *   `verify`: Step -> Sensor (Check a value).
    *   `action`: Step -> Component (Press a button).
    *   `next`: Step -> Step (Sequence).

### Integration Features
1.  **Visualization**: A force-directed graph (nodes repel, links attract) renders the procedure network.
2.  **Auto-Focus**: The system monitors the live simulation state.
    *   *Example*: If `FW LOW FLOW` alarm is active, the graph automatically zooms and centers on **STEP 2** (the relevant step).
    *   *Example*: If `REACTOR TRIPPED`, it jumps to **STEP 4**.
3.  **Hover Tooltips**: Hovering over a node displays its detailed Type and ID.

---

## 5. AI Advisor (GraphRAG)

The **AI Advisor** combines the power of Large Language Models (LLMs) with the structured data of the Knowledge Graph. This is known as **GraphRAG (Retrieval Augmented Generation)**.

### How it Works
When a user asks a question (e.g., "What should I do now?"):
1.  **Context Assembly**: The system gathers:
    *   **Live Simulation Telemetry**: "FW Flow is 0, SG Level is 35%."
    *   **Knowledge Graph Data**: The full list of procedure steps and their logic.
2.  **Prompt Engineering**: A prompt is constructed sending this context to the **Google Gemini API**.
3.  **Response**: Gemini analyzes the situation against the procedure rules and provides a safety-critical answer.

### Why this approach?
*   **Accuracy**: The AI doesn't hallucinate procedures; it reads them directly from the graph data we provide.
*   **Context-Awareness**: It knows the *exact* current state of the plant (e.g., "The pump is currently OFF").
