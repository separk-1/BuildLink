import { create } from 'zustand';
import { logger } from '../utils/logger';

// Physics Constants
const TICK_RATE = 100; // ms (10Hz)
const DT = TICK_RATE / 1000; // seconds

interface SimulationState {
  // --- System State ---
  last_log_time: number;
  fw_flow: number;      // kg/s
  sg_level: number;     // %
  sg_pressure: number;  // MPa
  reactor_power: number;// %
  turbine_speed: number;// rpm

  // --- Controls ---
  fw_pump_on: boolean;
  fw_iv_open: boolean;  // Isolation Valve
  fw_cv: number;        // Control Valve (0.0 - 1.0) - Renamed from fw_cv_open per spec
  msiv_open: boolean;   // Main Steam Isolation Valve

  // --- Trip Status ---
  reactor_tripped: boolean;
  turbine_tripped: boolean;

  // --- Malfunctions ---
  fault_severity: number; // 0.0 to 1.0 - Renamed from malfunction_severity per spec

  // --- Alarms ---
  alarms: string[];

  // --- Actions ---
  togglePump: () => void;
  toggleFwIv: () => void;
  toggleMsiv: () => void;
  setFwCv: (val: number) => void;
  tripReactor: () => void;
  tripTurbine: () => void;
  tick: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial State
  last_log_time: 0,
  fw_flow: 1000,
  sg_level: 50,
  sg_pressure: 6.0,
  reactor_power: 100,
  turbine_speed: 1800,

  fw_pump_on: true,
  fw_iv_open: true,
  fw_cv: 0.8,
  msiv_open: true,

  reactor_tripped: false,
  turbine_tripped: false,

  fault_severity: 0.0,
  alarms: [],

  // Actions
  togglePump: () => {
    const s = get();
    const newVal = !s.fw_pump_on;
    logger.logAction('TOGGLE_PUMP', { target: 'FW_PUMP', value: newVal ? 'ON' : 'OFF' });
    set({ fw_pump_on: newVal });
  },
  toggleFwIv: () => {
    const s = get();
    const newVal = !s.fw_iv_open;
    logger.logAction('TOGGLE_FW_IV', { target: 'FW_IV', value: newVal ? 'OPEN' : 'CLOSED' });
    set({ fw_iv_open: newVal });
  },
  toggleMsiv: () => {
    const s = get();
    const newVal = !s.msiv_open;
    logger.logAction('TOGGLE_MSIV', { target: 'MSIV', value: newVal ? 'OPEN' : 'CLOSED' });
    set({ msiv_open: newVal });
  },
  setFwCv: (val) => {
    const newVal = Math.max(0, Math.min(1, val));
    logger.logAction('SET_FW_CV', { target: 'FW_CV', value: newVal });
    set({ fw_cv: newVal });
  },
  tripReactor: () => {
      logger.logAction('TRIP_REACTOR', { target: 'REACTOR', value: 'TRIP' });
      set({ reactor_tripped: true, reactor_power: 0 });
  },
  tripTurbine: () => {
      logger.logAction('TRIP_TURBINE', { target: 'TURBINE', value: 'TRIP' });
      set({ turbine_tripped: true, turbine_speed: 0 });
  },

  tick: () => {
    const s = get();

    // --- 1. Calculate Feedwater Flow ---
    // fw_flow = k * pump_on * iv_open * cv_pos * (1 - fault_severity)
    const MAX_FLOW = 1500;
    let flow_target = MAX_FLOW * s.fw_cv;

    if (!s.fw_pump_on) flow_target = 0;
    if (!s.fw_iv_open) flow_target = 0;

    // Apply fault
    flow_target = flow_target * (1 - s.fault_severity);

    // Simple lag/inertia for flow changes
    const flow_change = (flow_target - s.fw_flow) * 0.1;
    const new_fw_flow = s.fw_flow + flow_change;

    // --- 2. Calculate Steam Out ---
    // Derived from reactor_power. Drops to 0 if MSIV is closed.
    let steam_out = (s.reactor_power / 100) * 1200; // 1200 is nominal
    if (!s.msiv_open) steam_out = 0;

    // --- 3. Calculate SG Level ---
    // d(sg_level) = (fw_flow - steam_out) * scale_factor
    const mass_balance = new_fw_flow - steam_out;
    const level_delta = mass_balance * 0.005 * DT;

    let new_sg_level = s.sg_level + level_delta;
    new_sg_level = Math.max(0, Math.min(100, new_sg_level));

    // --- 4. Calculate Pressure ---
    let target_pressure = 6.0;
    if (s.reactor_power > 10) target_pressure = 6.0 + (s.reactor_power - 100) * 0.01;

    if (!s.msiv_open && s.reactor_power > 0) {
        target_pressure += 0.1;
    }
    const new_pressure = s.sg_pressure + (target_pressure - s.sg_pressure) * 0.05;

    // --- 5. Determine Alarms ---
    const currentAlarms: string[] = [];
    if (new_fw_flow < 800 && s.reactor_power > 10) currentAlarms.push('FW LOW FLOW');
    if (new_sg_level < 30) currentAlarms.push('SG LOW LEVEL');
    if (new_sg_level > 80) currentAlarms.push('SG HIGH LEVEL');
    if (s.reactor_power > 102) currentAlarms.push('RX OVER POWER');
    if (s.reactor_tripped) currentAlarms.push('RX TRIPPED');
    if (s.turbine_tripped) currentAlarms.push('TURBINE TRIPPED');

    // --- Update State ---
    const updates: Partial<SimulationState> = {
      fw_flow: new_fw_flow,
      sg_level: new_sg_level,
      sg_pressure: new_pressure,
      alarms: currentAlarms
    };

    // Logging Snapshot Logic (1Hz)
    if (Date.now() - s.last_log_time >= 1000) {
        updates.last_log_time = Date.now();
        // Merge current state with updates for logging
        logger.logSnapshot({ ...s, ...updates });
    }

    set(updates);
  }
}));
