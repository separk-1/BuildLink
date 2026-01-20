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
  fw_cv_open: number;   // Control Valve (0.0 - 1.0)
  msiv_open: boolean;   // Main Steam Isolation Valve

  // --- Trip Status ---
  reactor_tripped: boolean;
  turbine_tripped: boolean;

  // --- Malfunctions ---
  malfunction_severity: number; // 0.0 to 1.0 (Simulation of FW loss cause)

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
  fw_cv_open: 0.8, // Normal operation position
  msiv_open: true,

  reactor_tripped: false,
  turbine_tripped: false,

  malfunction_severity: 0.0, // Start healthy

  // Actions
  togglePump: () => {
    set((state) => {
        logger.logAction('TOGGLE_PUMP', { from: state.fw_pump_on, to: !state.fw_pump_on });
        return { fw_pump_on: !state.fw_pump_on };
    });
  },
  toggleFwIv: () => {
    set((state) => {
        logger.logAction('TOGGLE_FW_IV', { from: state.fw_iv_open, to: !state.fw_iv_open });
        return { fw_iv_open: !state.fw_iv_open };
    });
  },
  toggleMsiv: () => {
    set((state) => {
        logger.logAction('TOGGLE_MSIV', { from: state.msiv_open, to: !state.msiv_open });
        return { msiv_open: !state.msiv_open };
    });
  },
  setFwCv: (val) => {
    const newVal = Math.max(0, Math.min(1, val));
    // Log sparingly for sliders if needed, but for now log all set events
    logger.logAction('SET_FW_CV', { value: newVal });
    set({ fw_cv_open: newVal });
  },
  tripReactor: () => {
      logger.logAction('TRIP_REACTOR', {});
      set({ reactor_tripped: true, reactor_power: 0 });
  },
  tripTurbine: () => {
      logger.logAction('TRIP_TURBINE', {});
      set({ turbine_tripped: true, turbine_speed: 0 });
  },

  tick: () => {
    const s = get();

    // --- 1. Calculate Feedwater Flow ---
    // Flow = k * pump * iv * cv * (1 - malfunction)
    // Nominal flow at 100% power is approx 1200 kg/s
    const MAX_FLOW = 1500;
    let flow_target = MAX_FLOW * s.fw_cv_open;

    if (!s.fw_pump_on) flow_target = 0;
    if (!s.fw_iv_open) flow_target = 0;

    // Apply malfunction (e.g. pump degradation or leak)
    flow_target = flow_target * (1 - s.malfunction_severity);

    // Simple lag/inertia for flow changes
    const flow_change = (flow_target - s.fw_flow) * 0.1;
    const new_fw_flow = s.fw_flow + flow_change;

    // --- 2. Calculate Steam Out (Power Dependent) ---
    // Steam flow out is roughly proportional to Reactor Power
    // If MSIV is closed, steam output drops to 0 (pressure spikes - handled below)
    let steam_out = (s.reactor_power / 100) * 1200; // 1200 is nominal
    if (!s.msiv_open) steam_out = 0;

    // --- 3. Calculate SG Level Change ---
    // Mass Balance: dLevel = (MassIn - MassOut) * ScaleFactor
    // Simplified: 50% is setpoint.
    const mass_balance = new_fw_flow - steam_out;
    // Level change scaling factor (arbitrary for gameplay feel)
    const level_delta = mass_balance * 0.005 * DT;

    let new_sg_level = s.sg_level + level_delta;
    new_sg_level = Math.max(0, Math.min(100, new_sg_level));

    // --- 4. Calculate Pressure ---
    // Simplified: Pressure relates to Temperature which relates to Power.
    // Also, if MSIV is closed and Power is ON, pressure spikes.
    // If Power is OFF, pressure drops.
    let target_pressure = 6.0; // Nominal MPa
    if (s.reactor_power > 10) target_pressure = 6.0 + (s.reactor_power - 100) * 0.01;

    // MSIV closed effect: Pressure builds up
    if (!s.msiv_open && s.reactor_power > 0) {
        target_pressure += 0.1; // Builds up fast per tick
    }

    // Move pressure towards target
    const new_pressure = s.sg_pressure + (target_pressure - s.sg_pressure) * 0.05;

    // --- Update State ---
    const updates: Partial<SimulationState> = {
      fw_flow: new_fw_flow,
      sg_level: new_sg_level,
      sg_pressure: new_pressure
    };

    // Logging Snapshot Logic (1Hz)
    if (Date.now() - s.last_log_time >= 1000) {
        updates.last_log_time = Date.now();
        logger.logSnapshot(s);
    }

    set(updates);
  }
}));
