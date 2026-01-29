# Fact-Based Step Logic

This document describes the exact logic used by the simulation system to determine the active procedure step in the Knowledge Graph. The logic is implemented in `src/components/ProcedurePanel.tsx` within the `getCurrentStepNodeId` function.

## Overview
The system monitors simulation state variables (e.g., flow rates, valve modes, trip statuses) and maps specific combinations of these states to a "Step ID". These IDs correspond to nodes in the Knowledge Graph (e.g., `pc_st_01_01`).

## Transition Logic

The logic is evaluated sequentially in the order listed below. The first condition that matches determines the active step.

### 1. Step 1: Monitoring Phase (`pc_st_01_01`)
**Condition:**
- Feedwater Flow (`fw_flow`) is greater than 1000 L/s
- **AND** Feedwater Low Flow Alarm (`fw_low_flow`) is **FALSE**

### 2. Step 2: Check Auto Mode (`pc_st_02_01`)
**Condition:**
- Feedwater Low Flow Alarm (`fw_low_flow`) is **TRUE**
- **AND** Feedwater Control Valve Mode (`fwcv_mode`) is **AUTO** (True)

### 3. Step 3: Check Pump Status (`pc_st_03_01`)
**Condition:**
- Feedwater Control Valve Mode (`fwcv_mode`) is **MANUAL** (False)
- **AND** Feedwater Pump Status (`fw_pump`) is **ON** (True)

### 4. Step 4: Rapid Shutdown (Trip) Actions
This phase handles reactor or turbine trips. It contains sub-steps for verification.

#### Step 4.0: General Trip Entry (`pc_st_04_01`)
**Condition:**
- Reactor Trip (`trip_reactor`) is **TRUE**
- **OR** Turbine Trip (`trip_turbine`) is **TRUE**
*(Note: This is the fallback if specific verification sub-steps below are not yet met but a trip has occurred)*

#### Step 5: Turbine Trip Verification (`pc_st_05_02`)
**Condition:**
- Turbine Trip (`trip_turbine`) is **TRUE**
- **AND** Turbine Speed CV (`turbine_speed_cv`) is **0** (Fully Closed)

#### Step 6: Reactor Trip Verification (`pc_st_06_02`)
**Condition:**
- Reactor Trip (`trip_reactor`) is **TRUE**
- **AND** All Rods Down (`all_rods_down`) is **TRUE**

## Default State
If none of the above conditions are met, no step is highlighted (`null`).
