import { create } from 'zustand';
import { logger } from '../utils/logger';

// Physics Constants
const TICK_RATE = 100; // ms (10Hz)
const DT = TICK_RATE / 1000; // seconds

function convergeToRange(
    current: number,
    target: number,
    min: number,
    max: number,
    deltaMax: number
): number {
    const boundedTarget = Math.max(min, Math.min(max, target));

    const delta = boundedTarget - current;

    if (Math.abs(delta) > deltaMax) {
        return current + Math.sign(delta) * deltaMax;
    } else {
        return boundedTarget;
    }
}

export type ScenarioPreset = 'cv' | 'pump' | 'hard';

interface SimulationState {
  // --- System Configuration ---
  scenarioPreset: ScenarioPreset;
  trainingMode: boolean; // false = Deterministic, true = Stochastic
  time: number; // Simulation time in seconds
  tick_count: number;
  simulationEnded: boolean;

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
  display_turbine_rpm: number;

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
  pump_off_triggered: boolean; // Only applied for scenario B: pump
  reactor_cooled_down: boolean; // Only applied for scenario C: hard

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
const addNoise = (val: number, magnitude: number) => {
    return val + (Math.random() - 0.5) * magnitude;
};


const INITIAL_STATE = {
  time: 0,
  tick_count: 0,
  last_log_time: 0,
  simulationEnded: false,

  // Reactor
  reactivity: 98.3,
  display_reactivity: 98.3,

  core_t: 370.0,
  display_core_t: 370.0,

  pri_flow: 1101,
  display_pri_flow: 1101,

  // SG
  fw_flow: 1054,
  display_fw_flow: 1054,

  fwcv_degree: 0.5,
  fwcv_continuous: 0.5,

  sg_level: 50.0,
  display_sg_level: 50.0,

  steam_press: 114.4,
  display_steam_press: 114.4,

  // Turbine
  turbine_speed_cv: 1.0,
  turbine_load_cv: 1.0,
  turbine_bypass_cv: 0.0,
  turbine_rpm: 1800,
  display_turbine_rpm: 1800,
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
  pump_off_triggered: false, //scenario 'pump'
  reactor_cooled_down: false, //scenario 'hard'


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
  scenarioPreset: 'hard',
  trainingMode: true,
  activeStepId: 'pc_st_01_01', // Start at Step 1.1
  stepHistory: [],

  setActiveStepId: (id: string | null) => {
      set((state) => {
        const history = state.activeStepId
        ? [...state.stepHistory, state.activeStepId]
        : state.stepHistory;
        return { activeStepId: id, stepHistory: history };
    });
  },

  goToPreviousStep: () => set((state) => {
      if (state.stepHistory.length === 0) return {};
      const newHistory = [...state.stepHistory];
      const prevStep = newHistory.pop();
      return { activeStepId: prevStep || null, stepHistory: newHistory };
  }),

  setScenarioPreset: (preset) => set((state) => {
    // If Training Mode is ON, force Scenario C (hard) and ignore user selection
    if (state.trainingMode) {
        return {
        scenarioPreset: 'hard',
        ...INITIAL_STATE,
        activeStepId: 'pc_st_01_01',
        stepHistory: []
        };
    }

    // If Training Mode is OFF, allow user-selected scenario (A/B/C)
    return {
        scenarioPreset: preset,
        ...INITIAL_STATE,
        activeStepId: 'pc_st_01_01',
        stepHistory: []
    };
    }),

    toggleTrainingMode: () => set((state) => {
    const newMode = !state.trainingMode;

    // When turning Training Mode ON, force Scenario C (hard)
    if (newMode) {
        return {
        trainingMode: true,
        scenarioPreset: 'hard'
        };
    }

    // When turning Training Mode OFF, keep current scenario and allow manual selection
    return {
        trainingMode: false
    };
    }),

  resetSimulation: () => {
    const s = get();
    // Re-trigger load if needed, or just reset state
    set({
        ...INITIAL_STATE,
        scenarioPreset: s.scenarioPreset,
        trainingMode: s.trainingMode,
        activeStepId: 'pc_st_01_01',
        stepHistory: [],
    });
  },

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
    let updates: Partial<SimulationState> = {};
    const new_time = s.time + DT;
    const new_tick_count = s.tick_count + 1;

    updates.time = new_time;
    updates.tick_count = new_tick_count;

    const shouldUpdateDisplay = (new_tick_count % 10 === 0);

    // --- Rules: Time-based Triggers ---
    // We just need to ensure fault_active is set eventually if needed.
    if (!s.simulationEnded && new_time >= 5.0) {
        updates.fault_active = true;
    }

    // Reactor Logic
    let target_reactivity = 98.3;
    if (s.trip_reactor) target_reactivity = 0;
    const reactivity_change = (target_reactivity - s.reactivity) * 0.01;
    // Clamp reactivity 0-100
    const new_reactivity = Math.max(0, Math.min(100, s.reactivity + reactivity_change));


    // Core Temp Logic
    let target_core_t = 370;

    // For scenario A, B
    if (s.fault_active && s.sg_level < 45 && (s.scenarioPreset === 'cv' || s.scenarioPreset === 'pump')){
        target_core_t = 385;
    }

    // For scenario C
    if (s.fault_active && (s.scenarioPreset === 'hard')){
        target_core_t = 440 - s.turbine_bypass_cv*200; 
        if (s.safety_injection_engaged){
        target_core_t = 420 - s.turbine_bypass_cv*200;
        }
    }

    // For scenario C (after step 10.3)
    if (target_core_t < 250 || s.reactor_cooled_down){
        s.reactor_cooled_down = true;
        target_core_t = 240;
    }

    target_core_t = Math.min(450, Math.max(20, target_core_t));
    const new_core_t = s.core_t + (target_core_t - s.core_t) * 0.01;

    // Feedwater Logic
    let new_fwcv_degree = s.fwcv_degree;
    let new_fwcv_continuous = s.fwcv_continuous;
    let auto_correction = 0;

    // if fault_active is false, set fwcv_mode to Auto
    if (s.simulationEnded && s.scenarioPreset !== 'hard') {
        updates.fwcv_mode = true;
    }

    // Auto Mode Logic
    if (s.fwcv_mode) {
        const error = 50.0 - s.sg_level;
        auto_correction = error * 0.05;
        new_fwcv_continuous = Math.max(0, Math.min(1, 0.5 + auto_correction));

        if (s.fault_active) {
             auto_correction = -0.01;
             new_fwcv_continuous = Math.max(0, Math.min(1, s.fwcv_continuous + auto_correction));
        }
        
        new_fwcv_degree = Math.round(new_fwcv_continuous * 10) / 10;
        
        if (!s.fault_active && s.fw_pump && s.msiv && s.fwiv){
            const fwcv_target_min = 0.4;
            const fwcv_target_max = 0.6;
            const fwcv_delta_max = 0.02;
            new_fwcv_degree = convergeToRange(s.fwcv_degree, new_fwcv_degree, fwcv_target_min, fwcv_target_max, fwcv_delta_max);
            new_fwcv_degree = Math.round(new_fwcv_continuous * 10) / 10;
        }
    }

    // Pump Logic
    const pump_on = s.fw_pump;
    if (s.fault_active && s.scenarioPreset === 'pump' && !s.pump_off_triggered){
        s.fw_pump = false;
        s.pump_off_triggered = true;
    }

    // Flow Calculation
    let avail_pump_head = pump_on ? 2108 : 0;
    if (!s.fwiv) avail_pump_head = 0;

    // Hard failure flow factor
    let flow_factor_fault = 1.0;
    if (s.scenarioPreset === 'hard' && (s.fault_active || s.simulationEnded )) {
        flow_factor_fault = 0.0;
    }

    let target_fw_flow = 1054;
    if (s.fault_active && (s.scenarioPreset === 'cv' || s.scenarioPreset === 'pump')) {
        target_fw_flow = avail_pump_head * 0.55*new_fwcv_degree * flow_factor_fault; //If we set the constant for new_fwcv_degree to 0.5, the flow will be exactly 1054, which is enough to maintain the current SG level but cannot fill an empty SG tank. To allow the tank to be filled from empty, we set it slightly higher, at 0.6.
    }
    else {
        target_fw_flow = avail_pump_head * new_fwcv_degree * flow_factor_fault; 
    }

    let new_fw_flow = s.fw_flow + (target_fw_flow - s.fw_flow) * 0.1;
    new_fw_flow = Math.max(0, new_fw_flow);

    // SG Logic
    let steam_out = (s.steam_press/114.4)*1054

    const mass_balance = new_fw_flow - steam_out;
    let new_sg_level = s.sg_level + mass_balance * 0.005 * DT;
    new_sg_level = Math.max(40.5, Math.min(59.5, new_sg_level));

    if (!s.fault_active && s.fw_pump && s.msiv && s.fwiv && s.scenarioPreset !=='hard') {
        const sg_target_min = 49.5;
        const sg_target_max = 50.5;
        const sg_delta_max = 0.2;
        new_sg_level = convergeToRange(s.sg_level, new_sg_level, sg_target_min, sg_target_max, sg_delta_max);
    }

    // Pressure Logic
    let target_press = 114.4;
    if (!s.msiv) target_press = 75;
    if (s.msiv && new_core_t < 300) target_press = 60 + new_core_t*0.1;
    const new_press = s.steam_press + (target_press - s.steam_press) * 0.05;

    // Turbine Logic
    let target_rpm = 1800 - 1800 * (1-s.turbine_speed_cv) * 0.2;
    if (s.trip_turbine){
        target_rpm = 0;
        s.turbine_speed_cv = 0;
        s.turbine_load_cv = 0;
    } 
    const new_rpm = s.turbine_rpm + (target_rpm - s.turbine_rpm) * 0.01;

    // Pri Flow
    let target_pri_flow = 1101;
    if (!s.rcp) target_pri_flow = 0;
    const new_pri_flow = s.pri_flow + (target_pri_flow - s.pri_flow) * 0.05;

 
    // --- Update Physics Values ---
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
        // Clamp display reactivity 0-100
        const raw_reactivity = !s.trip_reactor ? addNoise(updates.reactivity ?? new_reactivity, 0.5): updates.reactivity ?? new_reactivity;
        updates.display_reactivity = Math.max(0, Math.min(100, raw_reactivity));

        const raw_pri_flow_display = addNoise(updates.pri_flow ?? new_pri_flow, 10);
        updates.display_pri_flow = Math.max(0, raw_pri_flow_display);

        updates.display_core_t = addNoise(updates.core_t ?? new_core_t, 1.0);

        const raw_fw_display = addNoise(updates.fw_flow ?? new_fw_flow, 10);
        updates.display_fw_flow = Math.max(0, raw_fw_display);

        const raw_sg_display = addNoise(updates.sg_level ?? new_sg_level, 0.5);
        updates.display_sg_level = Math.max(0, raw_sg_display);

        updates.display_steam_press = addNoise(updates.steam_press ?? new_press, 0.5);
        
        updates.display_turbine_rpm = !s.trip_turbine ? addNoise(updates.turbine_rpm ?? new_rpm, 10): updates.turbine_rpm ?? new_rpm;
    }

    // --- Annunciator Logic ---
    // Note: We use the 'updates' values (which might have been overridden by transitions)
    const final_reactivity = updates.reactivity ?? new_reactivity;
    const final_core_t = updates.core_t ?? new_core_t;
    const final_pri_flow = updates.pri_flow ?? new_pri_flow;
    const final_sg_level = updates.sg_level ?? new_sg_level;
    const final_fw_flow = updates.fw_flow ?? new_fw_flow;
    const final_press = updates.steam_press ?? new_press;
    const final_rpm = updates.turbine_rpm ?? new_rpm;

    // Primary
    updates.rx_over_limit = final_reactivity > 102;
    updates.core_temp_high = final_core_t > 400;
    updates.high_temp_high_rx_trip = updates.core_temp_high;
    updates.core_temp_low = final_core_t < 270;
    updates.low_primary_coolant = final_pri_flow < 1000;
    updates.reactor_coolant_pump_trip = !s.rcp;
    updates.safety_injection_engaged = s.activate_si;
    updates.cnmt_rad_monitor = false;
    updates.all_rods_down = final_reactivity < 50;

    // Secondary
    updates.sg_high_level = final_sg_level > 55;
    updates.sg_low_level = final_sg_level < 45;
    updates.fw_low_flow = final_fw_flow < 500;
    updates.fw_pump_trip = !pump_on;
    updates.low_turbine_pressure = final_press < 40;
    updates.ms_rad_monitor = false;

    // Turbine
    updates.turbine_trip = s.trip_turbine;
    updates.ready_to_roll = !s.trip_turbine && final_rpm < 100;
    updates.ready_to_sync = final_rpm > 1750 && final_rpm < 1850;
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
