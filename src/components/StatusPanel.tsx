import { useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';

export const StatusPanel = () => {
  const state = useSimulationStore();

  // Setup Tick Loop
  useEffect(() => {
    const interval = setInterval(() => {
      state.tick();
    }, 100); // 100ms = 10Hz
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h2 className="panel-title">
        <span>STATUS / DISPLAY</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>LIVE</span>
      </h2>
      <div className="panel-content" style={{ flexDirection: 'column', gap: '10px' }}>

        {/* Annunciator Grid */}
        <div className="annunciator-grid">
            {/* Primary Column */}
            <div className="annunciator-col">
                <div className="annunciator-header">PRIMARY</div>
                <AlarmTile label="RX OVER LIMIT" active={state.rx_over_limit} />
                <AlarmTile label="CORE T HIGH" active={state.core_temp_high} />
                <AlarmTile label="CORE T LOW" active={state.core_temp_low} />
                <AlarmTile label="RODS DOWN" active={state.all_rods_down} />
                <AlarmTile label="RCP TRIP" active={state.reactor_coolant_pump_trip} />
                <AlarmTile label="LO PRI COOLANT" active={state.low_primary_coolant} />
                <AlarmTile label="SI ENGAGED" active={state.safety_injection_engaged} />
            </div>

            {/* Secondary Column */}
            <div className="annunciator-col">
                <div className="annunciator-header">SECONDARY</div>
                <AlarmTile label="SG HI LEVEL" active={state.sg_high_level} />
                <AlarmTile label="SG LO LEVEL" active={state.sg_low_level} />
                <AlarmTile label="FW LO FLOW" active={state.fw_low_flow} />
                <AlarmTile label="FW PUMP TRIP" active={state.fw_pump_trip} />
                <AlarmTile label="LO TB PRESS" active={state.low_turbine_pressure} />
                <AlarmTile label="MS RAD MON" active={state.ms_rad_monitor} />
            </div>

            {/* Turbine Column */}
            <div className="annunciator-col">
                <div className="annunciator-header">TURBINE</div>
                <AlarmTile label="TURBINE TRIP" active={state.turbine_trip} />
                <AlarmTile label="NOT SYNCED" active={state.not_synced_to_grid} />
                <AlarmTile label="READY ROLL" active={state.ready_to_roll} />
                <AlarmTile label="READY SYNC" active={state.ready_to_sync} />
                <AlarmTile label="ATMOS DUMP" active={state.atmos_dump_active} />
                <AlarmTile label="NOT LATCHED" active={state.not_latched} />
            </div>
        </div>

        {/* Main Display Area (Split Diagram & Gauges) */}
        <div style={{ display: 'flex', flex: 1, width: '100%', gap: '12px', minHeight: 0 }}>

          {/* Left: Diagram (Simplified Canvas/SVG) */}
          <div style={{ flex: 2, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', position: 'relative', background: '#0f172a' }}>
            <Schematic state={state} />
          </div>

          {/* Right: Key Values List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
            <ValueDisplay label="Reactivity" value={state.display_reactivity.toFixed(1)} unit="%" />
            <ValueDisplay label="Core Temp" value={state.display_core_t.toFixed(1)} unit="°C" alert={state.core_temp_high} />
            <ValueDisplay label="Pri Flow" value={(state.display_pri_flow/1000).toFixed(1)} unit="kL/s" />
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <ValueDisplay label="SG Level" value={state.display_sg_level.toFixed(1)} unit="%"
              alert={state.sg_low_level || state.sg_high_level} />
            <ValueDisplay label="Stm Press" value={state.display_steam_press.toFixed(1)} unit="kg/cm²" />
            <ValueDisplay label="FW Flow" value={state.display_fw_flow.toFixed(0)} unit="L/s"
              alert={state.fw_low_flow} />
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <ValueDisplay label="Turb Speed" value={state.turbine_rpm.toFixed(0)} unit="rpm" />
          </div>

        </div>

      </div>
    </>
  );
};

const AlarmTile = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`annunciator-tile ${active ? 'active' : ''}`}>
    {label}
  </div>
);

const ValueDisplay = ({ label, value, unit, alert = false }: { label: string, value: string, unit: string, alert?: boolean }) => (
  <div className={`value-row ${alert ? 'alert' : ''}`}>
    <span className="value-label">{label}</span>
    <span className="value-data">
      {value}<span className="unit">{unit}</span>
    </span>
  </div>
);

// Simplified SVG Schematic
const Schematic = ({ state }: { state: any }) => {
  // Colors from CSS vars (hardcoded here for SVG compatibility, or use 'currentColor' tricks, but hex is safer for lines)
  // Normal Blue: #3b82f6, Danger Red: #ef4444, Muted: #475569
  const colorFlow = '#3b82f6';
  const colorSteam = '#ef4444';
  const colorMuted = '#334155';
  const colorOn = '#22c55e';
  const colorOff = '#eab308'; // Amber for closed/off if abnormal, or just grey. Let's use amber for closed valves.

  const fwColor = state.display_fw_flow > 100 ? colorFlow : colorMuted;
  const steamColor = state.msiv && state.display_steam_press > 10 ? colorSteam : colorMuted;

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ padding: '10px' }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L6,3 z" fill={colorFlow} />
        </marker>
      </defs>

      {/* FW Pump */}
      <circle cx="50" cy="150" r="12" stroke="#94a3b8" strokeWidth="2" fill={state.fw_pump ? colorOn : colorMuted} />
      <text x="50" y="175" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">FW PUMP</text>

      {/* FW Line */}
      <line x1="62" y1="150" x2="100" y2="150" stroke={fwColor} strokeWidth="4" />

      {/* FW IV */}
      <rect x="100" y="138" width="12" height="24" rx="2" fill={state.fwiv ? colorOn : colorOff} stroke="#000" />
      <text x="106" y="130" textAnchor="middle" fontSize="10" fill="#94a3b8">IV</text>

      {/* Line to CV */}
      <line x1="112" y1="150" x2="140" y2="150" stroke={fwColor} strokeWidth="4" />

      {/* FW CV */}
      <path d="M 140 140 L 150 160 L 160 140 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M 140 160 L 150 140 L 160 160 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <text x="150" y="130" textAnchor="middle" fontSize="10" fill="#f8fafc">CV {(state.fwcv_degree*100).toFixed(0)}%</text>

      {/* Line to SG */}
      <line x1="160" y1="150" x2="200" y2="150" stroke={fwColor} strokeWidth="4" />
      <line x1="200" y1="150" x2="200" y2="100" stroke={fwColor} strokeWidth="4" />

      {/* Steam Generator */}
      <rect x="180" y="50" width="40" height="80" rx="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
      <text x="200" y="100" textAnchor="middle" fontSize="10" fill="#94a3b8" opacity="0.5">SG</text>

      {/* Water Level Visualization */}
      <rect x="182" y={128 - (state.display_sg_level * 0.76)} width="36" height={state.display_sg_level * 0.76} fill={colorFlow} opacity="0.6" rx="2" />

      {/* Steam Line */}
      <line x1="200" y1="50" x2="200" y2="30" stroke={steamColor} strokeWidth="4" />
      <line x1="200" y1="30" x2="250" y2="30" stroke={steamColor} strokeWidth="4" />

      {/* MSIV */}
      <rect x="250" y="20" width="12" height="20" rx="2" fill={state.msiv ? colorOn : colorOff} stroke="#000" />
      <text x="256" y="15" textAnchor="middle" fontSize="10" fill="#94a3b8">MSIV</text>

      {/* To Turbine */}
      <line x1="262" y1="30" x2="290" y2="30" stroke={steamColor} strokeWidth="4" />
      <text x="290" y="30" textAnchor="end" fontSize="10" fill="#f8fafc" alignmentBaseline="middle">Turbine</text>

    </svg>
  );
};
