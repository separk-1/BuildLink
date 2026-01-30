# Operator-Driven Procedure Logic

This document describes the philosophy and implementation of the "Operator-Driven" step transition logic in the Knowledge Graph.

## Philosophy

The Knowledge Graph serves as a **Process Map** for the operator, not an automation tool. The goal is to visualize the procedure flow and require the operator to actively engage with the steps (Verifying, Deciding, Acting).

Unlike the previous "Fact-Based" logic which automatically jumped steps based on simulator state, this system requires explicit **Operator Action** to advance. This ensures:
1.  **Cognitive Engagement:** The operator must consciously confirm checks and make decisions.
2.  **Procedural Adherence:** The system tracks the operator's progress through the procedure, not just the plant's state.
3.  **Training Value:** It reinforces the "Verify-Act" loop.

## Transition Types

The system analyzes the outgoing edges of the current active step in the Knowledge Graph to determine the interaction mode.

### 1. Verify Step (`VERIFY`)
**Condition:** The current step has an outgoing edge labeled `verify` connecting to a component (Indicator/Controller).
**Behavior:**
*   The `verify` edge is highlighted in **Yellow**.
*   A **"CONFIRM CHECK"** button appears in the procedure panel.
*   **Operator Action:** The operator checks the component value on the panel, then clicks "CONFIRM CHECK".
*   **Result:** The system advances to the `next` step.

### 2. Decision Step (`DECISION`)
**Condition:** The current step has outgoing edges labeled `true_then` and `false_then` (or leads to a Logic Node with these edges).
**Behavior:**
*   The `if` or logic edges are highlighted in **Yellow**.
*   **"YES (TRUE)"** and **"NO (FALSE)"** buttons appear.
*   **Operator Action:** The operator evaluates the condition (mentally or by checking values) and selects the appropriate path.
*   **Result:** The system branches to the selected target node.

### 3. Action / Standard Step (`STEP`)
**Condition:** The current step has a simple `next` or generic edge (e.g., `follow_next_steps`).
**Behavior:**
*   The `next` edge is highlighted in **Blue**.
*   A **"NEXT STEP"** button appears.
*   **Operator Action:** The operator performs the procedure action (e.g., "Trip Reactor") and clicks "NEXT STEP".
*   **Result:** The system advances to the next step.

## Graph Data Structure
The logic relies on the CSV relationship definitions:
*   `verify`: Connects Step -> Component.
*   `if`: Connects Step -> Logic Node.
*   `true_then` / `false_then`: Connect Logic Node -> Next Step/Action.
*   `next`: Sequential connection.

## State Management
The active step is tracked in the global `simulationStore` (`activeStepId`). It defaults to `pc_st_01_01` (Step 1.1) on reset.
