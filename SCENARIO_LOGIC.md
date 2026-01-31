# Scenario Logic & Procedure Engine

This document details how the NPP Simulator manages scenario progression, procedure steps, and state transitions using a data-driven approach.

## ⚙️ Hybrid Physics/Logic Engine

The simulator operates on a hybrid model that combines real-time physics with event-driven state transitions.

1.  **Physics Loop (10Hz)**:
    *   Handles continuous dynamics (e.g., `Flow = Pump_Status * Valve_Position`).
    *   Adds noise to simulate sensor fluctuation.
    *   Runs continuously in the background.

2.  **Procedure Rules Engine**:
    *   Overrides physics variables based on specific procedure steps defined in a CSV file.
    *   Allows the procedure to "guide" the plant state in specific scenarios where physics modeling would be too complex (e.g., "Feed & Bleed" cooling efficacy).

## 📊 Variables & Units

| Variable | Unit | Initial Value | Notes |
| :--- | :--- | :--- | :--- |
| `Reactivity` | % | 100 | Reactor Power |
| `core_t` | °C | 370 | Core Temperature. **High Alarm > 400°C** |
| `pri_flow` | L/s | 1101 | Primary Coolant Flow |
| `fw_flow` | L/s | 1054 | Feedwater Flow |
| `fwcv_degree`| % (0-1)| 50% (0.5)| Feedwater Control Valve Position |
| `sg_level` | % | 50 | Steam Generator Level |

> **Note:** Units were updated to L/s for flow measurements to align with physical scale.

## 📄 Data Source: `procedure_time.csv`

The core logic is defined in `public/data/procedure_time.csv`. This file maps "Procedure Steps" to "State Changes".

### CSV Structure

| Column | Description |
| :--- | :--- |
| `after_action` | The Trigger (Step ID). |
| | - `0` (or `0_0`): Initial State. Applied immediately on load. |
| | - `10sec`: Ramp Transition. Applied immediately but transitions values over **10 seconds** (Event Onset). |
| | - `StepID`: Applied when the user completes a step (e.g., `1_1`). |
| `scenario` | The Scope. `all` = Applies to everyone. `A`, `B`, `C` = Applies only to that Scenario Preset. |
| `status` | Special flags. `End` = Triggers the "Scenario Complete" success popup. |
| `Variable Columns` | Columns like `Reactivity`, `core_t`, `pri_flow`, `fw_flow`, etc. define the target state. |

### Value Syntax

*   **Empty**: No change. Keep current physics value.
*   **Number (e.g., `385`)**: Linearly interpolate the variable to this value over **3.0 seconds**.
*   **Underscore Number (e.g., `_405`)**: Linearly interpolate to this value over **5.0 seconds** (slower transition).
*   **TRUE / FALSE**: Immediately set a boolean flag (e.g., `trip_turbine`).

## 🔄 Logic Flow

1.  **Initialization**:
    *   On load, the system reads `procedure_time.csv`.
    *   It applies the `0` (Initial) row immediately to set start conditions.
    *   It triggers the `10sec` row immediately. Since this has a special 10-second duration, variables ramp from the Initial values to the 10-second Target values over the first 10 seconds. This creates the "Event Onset" phase.
    *   At `t=10s`, `fault_active` becomes true, enabling specific scenario malfunctions (like valve drift or pump trip) if not explicitly handled by the transition.

2.  **Step Activation (Operator-Driven)**:
    *   The user interacts with the Procedure Panel (clicking "NEXT STEP", "CONFIRM CHECK", etc.).
    *   This is the **Human Action** trigger described in `STEP_LOGIC.md`.
    *   `simulationStore.triggerStepAction(stepId)` is called.

3.  **Rule Lookup & Transition**:
    *   The store filters `procedureRules` for matching `after_action` and current `scenarioPreset`.
    *   **Transition**: `current = start + (target - start) * progress`.
    *   This allows the simulation to reflect the *consequences* of the operator's actions.

4.  **Completion**:
    *   Once the duration (3s, 5s, or 10s) passes, the variable is locked to the `targetVal`.
    *   If `status` is `End`, `simulationEnded` becomes true, showing the success popup.

## 🛠️ Adding New Scenarios

To add a new scenario logic:
1.  Edit `public/data/procedure_time.csv`.
2.  Define the `0` row (Initial State).
3.  Define the `10sec` row (Target state after 10s ramp).
4.  Add rows for specific steps where system state should change in response to operator actions.
