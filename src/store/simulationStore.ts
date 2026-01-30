import { create } from 'zustand';
import { logger } from '../utils/logger';

// Physics Constants
const TICK_RATE = 100; // ms (10Hz)
const DT = TICK_RATE / 1000; // seconds

export type ScenarioPreset = 'cv' | 'pump' | 'hard';

interface SimulationState {
  // --- System Configuration ---
  scenarioPreset: ScenarioPreset;
  trainingMode: boolean; // false = Deterministic, true = Stochastic
  time: number; // Simulation time in seconds
  tick_count: number;

  // --- System State (Float/Int) ---
  last_log_time: number;

  // Reactor
  reactivity: number;      // 0-100% (Power)
  display_reactivity: number; // Noisy

  core_t: number;          // 0-400 DEG C
  display_core_t: number;  // Noisy

  pri_flow: number;        // L/sec (Nominal ~45000?)
  display_pri_flow: number;// Noisy

  // SG
  fw_flow: number;         // L/sec
  display_fw_flow: number; // Noisy

  fwcv_degree: number;     // 0.0 - 1.0
  fwcv_continuous: number; // 0.0 - 1.0 (Internal continuous)
  sg_level: number;        // 0-100%
  display_sg_level: number;// Noisy

  steam_press: number;     // kg/cm2
  display_steam_press: number; // Noisy

  // Turbine
  turbine_speed_cv: number; // 0.0-1.0
  turbine_load_cv: number;  // 0.0-1.0
  turbine_bypass_cv: number;// 0.0-1.0
  turbine_rpm: number;      // Derived for display

  // --- Controls (Boolean/Controllable) ---
  // Reactor
  trip_reactor: boolean;
  activate_si: boolean;
  rcp: boolean;
  porviv: boolean;

  // SG
  fwcv_mode: boolean; // true = Auto, false = Manual
  fwiv: boolean;
  msiv: boolean;
  fw_pump: boolean;

  // Turbine
  trip_turbine: boolean;

  // --- Malfunctions (Hidden) ---
  fault_active: boolean; // Triggered after 5-10s

  // --- Annunciators (Boolean - Read Only) ---
  // Primary
  rx_over_limit: boolean;
  high_temp_high_rx_trip: boolean;
  core_temp_high: boolean;
  cnmt_rad_monitor: boolean;
  safety_injection_engaged: boolean;
  core_temp_low: boolean;
  all_rods_down: boolean;
  reactor_coolant_pump_trip: boolean;
  low_primary_coolant: boolean;

  // Secondary
  sg_high_level: boolean;
  ms_rad_monitor: boolean;
  sg_low_level: boolean;
  low_turbine_pressure: boolean;
  fw_low_flow: boolean;
  fw_pump_trip: boolean;

  // Turbine
  turbine_trip: boolean;
  atmos_dump_active: boolean;
  ready_to_roll: boolean;
  ready_to_sync: boolean;
  not_latched: boolean;
  not_synced_to_grid: boolean;

  // --- Procedures ---
  activeStepId: string | null;
  stepHistory: string[];
  setActiveStepId: (id: string | null) => void;
  goToPreviousStep: () => void;

  // --- Actions ---
  setScenarioPreset: (preset: ScenarioPreset) => void;
  toggleTrainingMode: () => void;
  resetSimulation: () => void;

  // Reactor Controls
  toggleTripReactor: () => void;
  toggleSi: () => void;
  toggleRcp: () => void;
  togglePorv: () => void;

  // SG Controls
  toggleFwcvMode: () => void;
  setFwcvDegree: (val: number) => void;
  toggleFwiv: () => void;
  toggleMsiv: () => void;
  toggleFwPump: () => void;

  // Turbine Controls
  toggleTripTurbine: () => void;
  setTurbineSpeedCv: (val: number) => void;
  setTurbineLoadCv: (val: number) => void;
  setTurbineBypassCv: (val: number) => void;

  tick: () => void;
}

// Helper to add noise
const addNoise = (val: number, magnitude: number, trainingMode: boolean) => {
    if (!trainingMode) return val; // Deterministic if trainingMode is OFF
    return val + (Math.random() - 0.5) * magnitude;
};

const INITIAL_STATE = {
  time: 0,
  tick_count: 0,
  last_log_time: 0,

  // Reactor
  reactivity: 100.0,
  display_reactivity: 100.0,

  core_t: 310.0,
  display_core_t: 310.0,

  pri_flow: 45000,
  display_pri_flow: 45000,

  // SG
  fw_flow: 1500,
  display_fw_flow: 1500,

  fwcv_degree: 0.8,
  fwcv_continuous: 0.8,

  sg_level: 50.0,
  display_sg_level: 50.0,

  steam_press: 60.0,
  display_steam_press: 60.0,

  // Turbine
  turbine_speed_cv: 1.0,
  turbine_load_cv: 1.0,
  turbine_bypass_cv: 0.0,
  turbine_rpm: 1800,

  // Controls
  trip_reactor: false,
  activate_si: false,
  rcp: true,
  porviv: false,

  fwcv_mode: true, // Auto
  fwiv: true,
  msiv: true,
  fw_pump: true,

  trip_turbine: false,

  fault_active: false,

  // Annunciators (Init all false)
  rx_over_limit: false,
  high_temp_high_rx_trip: false,
  core_temp_high: false,
  cnmt_rad_monitor: false,
  safety_injection_engaged: false,
  core_temp_low: false,
  all_rods_down: false,
  reactor_coolant_pump_trip: false,
  low_primary_coolant: false,
  sg_high_level: false,
  ms_rad_monitor: false,
  sg_low_level: false,
  low_turbine_pressure: false,
  fw_low_flow: false,
  fw_pump_trip: false,
  turbine_trip: false,
  atmos_dump_active: false,
  ready_to_roll: false,
  ready_to_sync: false,
  not_latched: false,
  not_synced_to_grid: false,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  ...INITIAL_STATE,
  scenarioPreset: 'cv',
  trainingMode: true,
  activeStepId: 'pc_st_01_01', // Start at Step 1.1
  stepHistory: [],

  setActiveStepId: (id) => set((state) => {
      // Don't push duplicates if clicking same step (unlikely but safe)
      // or if jumping back (handled by goToPreviousStep)
      const history = state.activeStepId ? [...state.stepHistory, state.activeStepId] : state.stepHistory;
      return { activeStepId: id, stepHistory: history };
  }),

  goToPreviousStep: () => set((state) => {
      if (state.stepHistory.length === 0) return {};
      const newHistory = [...state.stepHistory];
      const prevStep = newHistory.pop();
      return { activeStepId: prevStep || null, stepHistory: newHistory };
  }),

  setScenarioPreset: (preset) => set({ scenarioPreset: preset, ...INITIAL_STATE, activeStepId: 'pc_st_01_01', stepHistory: [] }),
  toggleTrainingMode: () => set((state) => ({ trainingMode: !state.trainingMode })),
  resetSimulation: () => set((state) => ({ ...INITIAL_STATE, scenarioPreset: state.scenarioPreset, trainingMode: state.trainingMode, activeStepId: 'pc_st_01_01', stepHistory: [] })),

  // --- Actions ---
  toggleTripReactor: () => {
      const newVal = !get().trip_reactor;
      logger.logAction('TOGGLE_TRIP_REACTOR', { target: 'trip_reactor', value: newVal });
      set({ trip_reactor: newVal });
  },
  toggleSi: () => {
      const newVal = !get().activate_si;
      logger.logAction('TOGGLE_SI', { target: 'activate_si', value: newVal });
      set({ activate_si: newVal });
  },
  toggleRcp: () => {
      const newVal = !get().rcp;
      logger.logAction('TOGGLE_RCP', { target: 'rcp', value: newVal });
      set({ rcp: newVal });
  },
  togglePorv: () => {
      const newVal = !get().porviv;
      logger.logAction('TOGGLE_PORV', { target: 'porviv', value: newVal });
      set({ porviv: newVal });
  },
  toggleFwcvMode: () => {
      const newVal = !get().fwcv_mode;
      logger.logAction('TOGGLE_FWCV_MODE', { target: 'fwcv_mode', value: newVal ? 'Auto' : 'Manual' });
      set({ fwcv_mode: newVal });
  },
  setFwcvDegree: (val) => {
      if (!get().fwcv_mode) {
        // Enforce 0.1 step rounding if not done by UI
        const steppedVal = Math.round(val * 10) / 10;
        logger.logAction('SET_FWCV_DEGREE', { target: 'fwcv_degree', value: steppedVal });
        set({ fwcv_degree: steppedVal, fwcv_continuous: steppedVal });
      }
  },
  toggleFwiv: () => {
      const newVal = !get().fwiv;
      logger.logAction('TOGGLE_FWIV', { target: 'fwiv', value: newVal });
      set({ fwiv: newVal });
  },
  toggleMsiv: () => {
      const newVal = !get().msiv;
      logger.logAction('TOGGLE_MSIV', { target: 'msiv', value: newVal });
      set({ msiv: newVal });
  },
  toggleFwPump: () => {
      const newVal = !get().fw_pump;
      logger.logAction('TOGGLE_FW_PUMP', { target: 'fw_pump', value: newVal });
      set({ fw_pump: newVal });
  },
  toggleTripTurbine: () => {
      const newVal = !get().trip_turbine;
      logger.logAction('TOGGLE_TRIP_TURBINE', { target: 'trip_turbine', value: newVal });
      set({ trip_turbine: newVal });
  },
  setTurbineSpeedCv: (val) => {
      const steppedVal = Math.round(val * 10) / 10;
      logger.logAction('SET_TURB_SPEED_CV', { target: 'turbine_speed_cv', value: steppedVal });
      set({ turbine_speed_cv: steppedVal });
  },
  setTurbineLoadCv: (val) => {
      const steppedVal = Math.round(val * 10) / 10;
      logger.logAction('SET_TURB_LOAD_CV', { target: 'turbine_load_cv', value: steppedVal });
      set({ turbine_load_cv: steppedVal });
  },
  setTurbineBypassCv: (val) => {
      const steppedVal = Math.round(val * 10) / 10;
      logger.logAction('SET_TURB_BYPASS_CV', { target: 'turbine_bypass_cv', value: steppedVal });
      set({ turbine_bypass_cv: steppedVal });
  },

  // --- Physics Tick ---
  tick: () => {
    const s = get();
    let updates: any = {};
    const new_time = s.time + DT;
    const new_tick_count = s.tick_count + 1;

    updates.time = new_time;
    updates.tick_count = new_tick_count;

    const shouldUpdateDisplay = !s.trainingMode || (new_tick_count % 10 === 0);

    // --- Scenario Trigger Logic (T=5s) ---
    // If not yet active, and time > 5s, trigger it
    let fault_active = s.fault_active;
    if (!fault_active && new_time >= 5.0) {
        fault_active = true;
        updates.fault_active = true;
        // Apply initial fault side-effects if needed
        if (s.scenarioPreset === 'pump') {
             updates.fw_pump = false; // Trip pump
        }
    }

    // 1. Reactor Logic
    let target_reactivity = s.reactivity;
    if (s.trip_reactor) {
        target_reactivity = 0;
        updates.all_rods_down = true;
    } else {
        updates.all_rods_down = false;
    }
    const reactivity_change = (target_reactivity - s.reactivity) * 0.1;
    let new_reactivity = s.reactivity + reactivity_change;

    // RCP effects Flow
    let target_pri_flow = s.rcp ? 45000 : 0;
    let new_pri_flow = s.pri_flow + (target_pri_flow - s.pri_flow) * 0.05;

    // Core Temp Logic
    let flow_factor = Math.max(0.1, new_pri_flow / 45000);
    let target_core_t = 280 + (new_reactivity * 0.4) / flow_factor;
    target_core_t = Math.min(400, Math.max(20, target_core_t));
    let new_core_t = s.core_t + (target_core_t - s.core_t) * 0.02;

    // 2. Feedwater Logic
    let new_fwcv_degree = s.fwcv_degree;
    let new_fwcv_continuous = s.fwcv_continuous;
    let auto_correction = 0;

    // Auto Mode Logic
    if (s.fwcv_mode) {
        const error = 50.0 - s.sg_level;
        auto_correction = error * 0.005;

        // Scenario A (CV Issue): If fault active, Auto fails (drifts closed or stuck)
        // Implementation: If CV Issue & Active, Auto logic drives it to 0 regardless of level
        if (fault_active && s.scenarioPreset === 'cv') {
             auto_correction = -0.01; // Drift closed
        }

        new_fwcv_continuous = Math.max(0, Math.min(1, s.fwcv_continuous + auto_correction));
        // Stepped logic: Round to nearest 0.1
        new_fwcv_degree = Math.round(new_fwcv_continuous * 10) / 10;
    } else {
        // Manual Mode:
        // If Scenario A (CV Issue): Manual works fine (user can open it).
        // So no change needed here.
    }

    // Pump Logic
    let pump_on = s.fw_pump;
    // Scenario B (Pump Issue): Pump trips at T=5. User can restart it.
    // Logic: If fault active, we already set pump to false in the trigger block.
    // If user toggles it back ON (s.fw_pump is true), it works.

    // Flow Calculation
    let avail_pump_head = pump_on ? 2000 : 0;
    if (!s.fwiv) avail_pump_head = 0;

    let flow_factor_fault = 1.0;
    if (fault_active && s.scenarioPreset === 'hard') {
        flow_factor_fault = 0.0; // Total blockage
    }

    let target_fw_flow = avail_pump_head * new_fwcv_degree * flow_factor_fault;
    let new_fw_flow = s.fw_flow + (target_fw_flow - s.fw_flow) * 0.1;
    new_fw_flow = Math.max(0, new_fw_flow);

    // 3. SG Logic
    let steam_out = (new_reactivity / 100) * 1500;
    if (!s.msiv) steam_out = 0;

    const mass_balance = new_fw_flow - steam_out;
    let new_sg_level = s.sg_level + mass_balance * 0.005 * DT;
    new_sg_level = Math.max(0, Math.min(100, new_sg_level));

    // Pressure Logic
    let target_press = 60.0;
    if (!s.msiv && new_reactivity > 0) target_press = 75.0;
    if (new_reactivity < 10) target_press = 40.0 + new_reactivity;
    let new_press = s.steam_press + (target_press - s.steam_press) * 0.05;

    // 4. Turbine Logic
    let target_rpm = 1800 * s.turbine_speed_cv;
    if (s.trip_turbine) target_rpm = 0;
    target_rpm = target_rpm * (1 - s.turbine_load_cv * 0.1);
    let new_rpm = s.turbine_rpm + (target_rpm - s.turbine_rpm) * 0.01;

    // --- Noise Application ---
    updates = {
        ...updates,
        reactivity: new_reactivity,
        pri_flow: new_pri_flow,
        core_t: new_core_t,
        fw_flow: new_fw_flow,
        fwcv_degree: new_fwcv_degree,
        fwcv_continuous: new_fwcv_continuous,
        sg_level: new_sg_level,
        steam_press: new_press,
        turbine_rpm: new_rpm,
    };

    if (shouldUpdateDisplay) {
        updates.display_reactivity = addNoise(new_reactivity, 0.5, s.trainingMode);
        updates.display_pri_flow = addNoise(new_pri_flow, 500, s.trainingMode);
        updates.display_core_t = addNoise(new_core_t, 1.0, s.trainingMode);
        updates.display_fw_flow = addNoise(new_fw_flow, 20, s.trainingMode);
        updates.display_sg_level = addNoise(new_sg_level, 0.5, s.trainingMode);
        updates.display_steam_press = addNoise(new_press, 0.5, s.trainingMode);
    }

    // --- Annunciator Logic (Uses True Values) ---

    // Primary
    updates.rx_over_limit = new_reactivity > 102;
    updates.core_temp_high = new_core_t > 330;
    updates.high_temp_high_rx_trip = updates.core_temp_high;
    updates.core_temp_low = new_core_t < 270 && new_reactivity > 10;
    updates.low_primary_coolant = new_pri_flow < 40000;
    updates.reactor_coolant_pump_trip = !s.rcp;
    updates.safety_injection_engaged = s.activate_si;
    updates.cnmt_rad_monitor = false;

    // Secondary
    updates.sg_high_level = new_sg_level > 80;
    updates.sg_low_level = new_sg_level < 30;
    updates.fw_low_flow = new_fw_flow < 500 && new_reactivity > 10;
    updates.fw_pump_trip = !pump_on;
    updates.low_turbine_pressure = new_press < 40;
    updates.ms_rad_monitor = false;

    // Turbine
    updates.turbine_trip = s.trip_turbine;
    updates.ready_to_roll = !s.trip_turbine && new_rpm < 100;
    updates.ready_to_sync = new_rpm > 1750 && new_rpm < 1850;
    updates.not_synced_to_grid = !updates.ready_to_sync;
    updates.atmos_dump_active = s.turbine_bypass_cv > 0.1;
    updates.not_latched = s.trip_turbine;

    // Snapshot Logging
    if (Date.now() - s.last_log_time >= 1000) {
        updates.last_log_time = Date.now();
        logger.logSnapshot({ ...s, ...updates });
    }

    set(updates);
  }
}));
