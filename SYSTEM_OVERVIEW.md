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
4.  **Procedure Panel (Bottom-Right)**: A dynamic visualization of the **Knowledge Graph**. It maps operational procedures into a network of steps, logic, and components, serving as the "Operator's Map."

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
    *   The Operator follows the steps in the **Procedure Panel**.
    *   Actions taken (e.g., verifying values, tripping reactor) update the simulation state.
    *   Completing the procedure stabilizes the plant.

---

## 3. Simulation Logic (Hybrid Model)

We utilize a hybrid model combining simplified physics with procedure-driven state transitions.

### Physics Loop (10Hz)
Focuses on continuous dynamics:
$$
\frac{d(\text{Level})}{dt} = \alpha \times (\text{FeedwaterFlow}) - \beta \times (\text{SteamOut})
$$
*   **Feedwater Flow**: Derived from Pump Status, Valve Position, and Line Resistance.
*   **Reactor Power**: Decays exponentially on Trip.

### Procedure Rules Engine
Certain scenario events are deterministic to ensure training consistency.
*   **Driver**: `SCENARIO_LOGIC.md` and `procedure_time.csv`.
*   **Mechanism**: When a specific Procedure Step is activated (e.g., "Step 5") by the operator, the engine looks up target values in the CSV.
*   **Transition**: The system linearly interpolates variables (e.g., Temperature, Flow) to the target values over 3-5 seconds. This allows the scenario to "force" specific outcomes (like a successful recovery) regardless of the precise physics inputs, ensuring the training narrative holds.

---

## 4. Operational Procedures & Knowledge Graph

We have digitized the standard operating procedure for LOFW into a **Knowledge Graph**. This graph is not just a static image; it is a data structure used by the system.

### Graph Structure
The graph consists of **Entities (Nodes)** and **Relationships (Edges)**:

*   **Nodes (What is involved?)**:
    *   `PC_ST` (Procedure Step): e.g., "STEP 1", "STEP 2".
    *   `PC_LO` (Logic): e.g., "IF FW Flow < 500".
    *   `CT` (Component/Controller): e.g., "FW Pump Switch".
    *   `IC` (Indicator/Sensor): e.g., "FW Flow Meter".
    *   `LER` (Licensee Event Report): Historic failure data (visible in Incident View).
*   **Edges (What is the procedure?)**:
    *   `verify`: Step -> Sensor (Check a value).
    *   `action`: Step -> Component (Press a button).
    *   `next`: Step -> Step (Sequence).

### Integration Features
1.  **Operator-Driven Walkthrough**: The user clicks "NEXT STEP", "CONFIRM CHECK", or "YES/NO" buttons to advance the procedure. This manual confirmation reinforces procedural adherence.
2.  **Auto-Focus**: The graph automatically zooms and centers on the **Active Step** (`activeStepId`) to guide the operator's attention.
3.  **Incident View**: Highlights connected failure modes (Step -> Control -> Component -> Incident) to provide context.

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
