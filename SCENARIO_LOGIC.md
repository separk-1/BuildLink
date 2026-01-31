# Scenario Logic & Procedure Engine

This document describes how the NPP Simulator manages scenario progression, procedure steps, and state transitions using a data-driven approach.

## Overview

The simulator uses a **Hybrid Physics/Logic Engine**.
1.  **Physics Loop (10Hz)**: Handles continuous dynamics (e.g., flow = pump * valve).
2.  **Procedure Rules Engine**: Overrides physics variables based on specific procedure steps defined in a CSV file.

## Variables & Units

| Variable | Unit | Initial Value | Notes |
| :--- | :--- | :--- | :--- |
| `Reactivity` | % | 100 | Reactor Power |
| `core_t` | °C | 370 | Core Temperature. **High Alarm > 400°C** |
| `pri_flow` | m/s | 1101 | Primary Coolant Flow |
| `fw_flow` | m/s | 1054 | Feedwater Flow |
| `fwcv_degree`| % (0-1)| 50% (0.5)| Feedwater Control Valve Position |
| `sg_level` | % | 50 | Steam Generator Level |

## Data Source: `procedure_time.csv`

The core logic is defined in `public/data/procedure_time.csv`. This file maps "Procedure Steps" to "State Changes".

### CSV Structure

| Column | Description |
| :--- | :--- |
| `after_action` | The Trigger. |
| | - `0` (or `0_0`): Initial State. Applied immediately on load. |
| | - `10sec`: Ramp Transition. Applied immediately but transitions values over **10 seconds**. |
| | - `StepID`: Applied when the user completes a step (e.g., `1_1`). |
| `scenario` | The Scope. `all` = Applies to everyone. `A`, `B`, `C` = Applies only to that Scenario Preset. |
| `status` | Special flags. `End` = Triggers the "System Stabilized" success popup. |
| `Variable Columns` | Columns like `Reactivity`, `core_t`, `pri_flow`, `fw_flow`, etc. define the target state. |

### value Syntax

*   **Empty**: No change. Keep current physics value.
*   **Number (e.g., `385`)**: Linearly interpolate the variable to this value over **3.0 seconds**.
*   **Underscore Number (e.g., `_405`)**: Linearly interpolate to this value over **5.0 seconds** (slower transition).
*   **TRUE / FALSE**: Immediately set a boolean flag (e.g., `trip_turbine`).

## Logic Flow

1.  **Initialization**:
    *   On load, the system reads `procedure_time.csv`.
    *   It applies the `0` (Initial) row immediately to set start conditions.
    *   It triggers the `10sec` row immediately. Since this has a special 10-second duration, variables ramp from the Initial values to the 10-second Target values over the first 10 seconds of the simulation. This creates a "settling in" or "event onset" phase.
    *   At `t=10s`, `fault_active` becomes true, enabling specific scenario malfunctions (like valve drift or pump trip) if not explicitly handled by the transition.

2.  **Step Activation**:
    *   User clicks "NEXT STEP", "CONFIRM CHECK", or "YES/NO" in the Procedure Panel.
    *   `simulationStore.triggerStepAction(stepId)` is called.
3.  **Rule Lookup & Transition**:
    *   The store filters `procedureRules` for matching `after_action` and current `scenarioPreset`.
    *   **Transition**: `current = start + (target - start) * progress`.
4.  **Completion**:
    *   Once the duration (3s, 5s, or 10s) passes, the variable is locked to the `targetVal`.
    *   If `status` is `End`, `simulationEnded` becomes true, showing the success popup.

## Adding New Scenarios

To add a new scenario logic:
1.  Edit `public/data/procedure_time.csv`.
2.  Define the `0` row (Initial State).
3.  Define the `10sec` row (Target state after 10s ramp).
4.  Add rows for specific steps where system state should change.
