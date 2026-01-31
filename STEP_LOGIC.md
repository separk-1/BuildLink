# Operator-Driven Procedure Logic

This document details the design philosophy and implementation of the "Operator-Driven" procedure visualization in the Knowledge Graph.

## 🎨 Design Principles

The Knowledge Graph is constructed based on three core visual elements:

1.  **Node (Entity):** Represents "What is involved?" (e.g., Valve, Pump, Alarm, Sensor).
2.  **Edge (Action):** Represents "What is the procedure?" (e.g., Verify, Check If, Transition).
3.  **Highlight (State):** Represents "Where are we now?" (The currently active procedural path).

## 🧠 Philosophy: Visualization vs. Automation

In this research, the purpose of the Knowledge Graph is **not** to automate the simulator or judge the plant state, but to **visualize the procedure steps** the operator must follow.

### The "Operator-Driven" Standard
The criterion for a step is not "What is the plant state?" but "**What is the operator's task?**".
If we were to automatically transition steps based purely on simulator variables, the meaning of critical procedural steps like `Verify` and `Check-If` would be lost.

*   **Verify** is not just a state check; it is a protocol ensuring the operator consciously acknowledges a condition before proceeding.
*   **Check-If** is not just a branch; it is a decision point where the operator interprets the situation and chooses a course of action.

These are **cognitive and physical actions**, not just data points. Therefore, we explicitly prevent automatic transitions in these phases.

## 🛑 Logic Implementation

### 1. Verify Steps
**Definition:** A step requiring confirmation of a component's status.
*   **System Behavior:** The system highlights the `verify` edge (connecting Step -> Component) in Yellow.
*   **Operator Task:** The operator looks at the Status Panel, confirms the value, and clicks **"CONFIRM CHECK"**.
*   **Logic:** The transition is triggered by the **Click Action**, not the variable value. The system trusts the operator's confirmation.

### 2. Check-If (Decision) Steps
**Definition:** A branching point based on a condition.
*   **System Behavior:** The system highlights the `if` edge and displays the decision options.
*   **Operator Task:** The operator judges the condition (e.g., "Is level < 50%?") and clicks **"YES (TRUE)"** or **"NO (FALSE)"**.
*   **Logic:** The transition follows the **Operator's Choice**. This allows for the analysis of correct vs. incorrect decisions (procedure adherence) during training.

### 3. Incident View
**Definition:** A mode to visualize the causal chain of failures.
*   **Behavior:** When toggled ON, the graph highlights the connection from the **Active Step** -> **Control** -> **System Component** -> **LER (Licensee Event Report)** nodes.
*   **Purpose:** To provide context on *why* a specific procedure step is relevant to potential failure modes.

## Summary

| Feature | Automation (Not used) | Operator-Driven (Used) |
| :--- | :--- | :--- |
| **Trigger** | Sensor Value (e.g., Flow < 500) | Human Action (Click) |
| **Role** | Machine executes procedure | Human executes, Machine guides |
| **Goal** | Efficiency / Control | Training / Visualization / Explainability |

This approach ensures the simulator remains a tool for **Human-in-the-Loop** training, providing high explainability and reinforcing procedural discipline.
