# GraphRAG Chatbot Logic & Architecture

## 1. Overview
The NPP Simulator employs a specialized **Graph Retrieval-Augmented Generation (GraphRAG)** system to power the AI Advisor. Unlike standard chatbots, this system bases its responses on the real-time physics simulation and the structural knowledge graph of the plant, allowing it to perform root cause analysis and procedural guidance.

## 2. Core Components

### A. The Knowledge Graph (Structural Context)
The simulator maintains a directed graph representing the plant's P&ID (Piping and Instrumentation Diagram).
- **Nodes:** Physical entities (Valves, Pumps, Tanks, Sensors) and Abstract entities (Procedure Steps, Logic Gates).
- **Edges:** Causal relationships (e.g., `FWCV` --*controls flow to*--> `SG`, `Pump` --*feeds*--> `Header`).
- **Source:** Loaded from `public/data/entity_v3_*.csv` and `relationship_v3_*.csv`.

### B. The Simulation State (Dynamic Context)
Real-time data from the physics engine (`simulationStore`) provides the *state* of every node.
- **Variables:** Temperatures, Pressures, Flows, Valve Positions (0.0-1.0), Alarm States (True/False).
- **Update Rate:** 10Hz physics tick, with noisy sensor readings for realism.

## 3. The GraphRAG Process

When a user asks a question (e.g., *"Why is the Steam Generator level dropping?"*), the system does not rely on the LLM's internal training data alone. Instead, it constructs a grounded prompt:

1.  **Context Retrieval:**
    *   The system identifies "active" nodes (e.g., components with active alarms or abnormal values).
    *   It traverses the Knowledge Graph to find *upstream* and *downstream* dependencies of these nodes.
    *   Example: If `SG Level` is low, the graph traversal identifies `Feedwater Control Valve (FWCV)` and `Feedwater Pump` as relevant connected entities.

2.  **State Augmentation:**
    *   The current values of these relevant entities are injected.
    *   *Graph:* `FWCV` -> feeds -> `SG`.
    *   *State:* `FWCV` = 0.0 (Closed), `SG Level` = 35% (Dropping).

3.  **Inference (Gemini API):**
    *   The augmented prompt is sent to Google Gemini.
    *   **Prompt Structure:** "You are a Senior Reactor Operator. Given the following plant topology and current sensor readings, explain the situation."
    *   The LLM uses the graph structure to understand *causality* and the state values to understand *reality*.

4.  **Response Generation:**
    *   The model deduces: "The Steam Generator level is dropping because the Feedwater Control Valve (FWCV) is fully closed, cutting off supply despite the pump being running."
    *   It cites the specific sensor values that led to this conclusion.

## 4. Advantages over Standard RAG

| Feature | Standard RAG | GraphRAG (Ours) |
| :--- | :--- | :--- |
| **Context Source** | Unstructured Text Documents | Structured Graph + Real-time Data |
| **Reasoning** | Semantic Similarity Matching | Causal/Topological Navigation |
| **Dynamic Handling** | Static Knowledge Base | Live Physics State Adaptation |
| **Root Cause Analysis** | Limited to retrieved snippets | Traces paths (Upstream/Downstream) |

## 5. Technical Implementation
- **Frontend:** `src/components/AIAdvisorPanel.tsx` manages the chat UI and context assembly.
- **State Management:** `zustand` store provides the snapshot.
- **API:** Google Gemini Pro (`VITE_GEMINI_API_KEY`).
