# Scenario Logic & Procedure Engine

This document describes how the NPP Simulator manages scenario progression, procedure steps, and state transitions using a data-driven approach.

## Overview

The simulator uses a **Hybrid Physics/Logic Engine**.
1.  **Physics Loop (10Hz)**: Handles continuous dynamics (e.g., flow = pump * valve).
2.  **Procedure Rules Engine**: Overrides physics variables based on specific procedure steps defined in a CSV file.

## Data Source: `procedure_time.csv`

The core logic is defined in `public/data/procedure_time.csv`. This file maps "Procedure Steps" to "State Changes".

### CSV Structure

| Column | Description |
| :--- | :--- |
| `after_action` | The Trigger. The Rule fires when the system *completes* this step ID (or enters it). Also supports `5sec` for time-based triggers. |
| `scenario` | The Scope. `all` = Applies to everyone. `A`, `B`, `C` = Applies only to that Scenario Preset. |
| `status` | Special flags. `End` = Triggers the "System Stabilized" success popup. |
| `Variable Columns` | Columns like `Reactivity`, `core_t`, `pri_flow`, `fw_flow`, etc. define the target state. |

### value Syntax

*   **Empty**: No change. Keep current physics value.
*   **Number (e.g., `385`)**: Linearly interpolate the variable to this value over **3.0 seconds**.
*   **Underscore Number (e.g., `_405`)**: Linearly interpolate to this value over **5.0 seconds** (slower transition).
*   **TRUE / FALSE**: Immediately set a boolean flag (e.g., `trip_turbine`).
    *   *Special Cases*: Setting `reactor_coolant_pump_trip` to TRUE also sets the internal `rcp` state to FALSE.

### Example

```csv
after_action,scenario,status,Reactivity,core_t
5sec,A,,385,_400
```

*   **Trigger**: 5 seconds after start (or specific step).
*   **Scenario**: Only for Preset A.
*   **Effect**:
    *   `Reactivity` transitions to `385` over 3 seconds.
    *   `core_t` transitions to `400` over 5 seconds (noted by `_`).

## Logic Flow

1.  **Step Activation**:
    *   User clicks "NEXT STEP" or "CONFIRM CHECK" in the Procedure Panel.
    *   `simulationStore.triggerStepAction(stepId)` is called.
2.  **Rule Lookup**:
    *   The store filters `procedureRules` for matching `after_action` and current `scenarioPreset`.
3.  **Transition Creation**:
    *   For each defined variable update, an `ActiveTransition` is created.
    *   The physics loop (`tick`) detects active transitions and linearly interpolates the value: `current = start + (target - start) * progress`.
4.  **Completion**:
    *   Once the duration (3s or 5s) passes, the variable is locked to the `targetVal`.
    *   If `status` is `End`, `simulationEnded` becomes true, showing the success popup.

## Adding New Scenarios

To add a new scenario logic:
1.  Edit `public/data/procedure_time.csv`.
2.  Add rows for the steps where system state should change.
3.  Ensure the Step IDs match those in the Knowledge Graph (`pc_st_XX_YY`).
