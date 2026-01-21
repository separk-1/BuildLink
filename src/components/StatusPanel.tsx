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
      <h2 className="panel-title">STATUS / DISPLAY</h2>
      <div className="panel-content" style={{ flexDirection: 'column', width: '100%', padding: '5px', gap: '5px' }}>

        {/* Annunciator Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', width: '100%', height: '30%' }}>
            {/* Primary Column */}
            <div className="alarm-col">
                <div className="alarm-header">PRIMARY</div>
                <AlarmTile label="RX OVER LIMIT" active={state.rx_over_limit} />
                <AlarmTile label="CORE T HIGH" active={state.core_temp_high} />
                <AlarmTile label="CORE T LOW" active={state.core_temp_low} />
                <AlarmTile label="RODS DOWN" active={state.all_rods_down} />
                <AlarmTile label="RCP TRIP" active={state.reactor_coolant_pump_trip} />
                <AlarmTile label="LO PRI COOLANT" active={state.low_primary_coolant} />
                <AlarmTile label="SI ENGAGED" active={state.safety_injection_engaged} />
            </div>

            {/* Secondary Column */}
            <div className="alarm-col">
                <div className="alarm-header">SECONDARY</div>
                <AlarmTile label="SG HI LEVEL" active={state.sg_high_level} />
                <AlarmTile label="SG LO LEVEL" active={state.sg_low_level} />
                <AlarmTile label="FW LO FLOW" active={state.fw_low_flow} />
                <AlarmTile label="FW PUMP TRIP" active={state.fw_pump_trip} />
                <AlarmTile label="LO TB PRESS" active={state.low_turbine_pressure} />
                <AlarmTile label="MS RAD MON" active={state.ms_rad_monitor} />
            </div>

            {/* Turbine Column */}
            <div className="alarm-col">
                <div className="alarm-header">TURBINE</div>
                <AlarmTile label="TURBINE TRIP" active={state.turbine_trip} />
                <AlarmTile label="NOT SYNCED" active={state.not_synced_to_grid} />
                <AlarmTile label="READY ROLL" active={state.ready_to_roll} />
                <AlarmTile label="READY SYNC" active={state.ready_to_sync} />
                <AlarmTile label="ATMOS DUMP" active={state.atmos_dump_active} />
                <AlarmTile label="NOT LATCHED" active={state.not_latched} />
            </div>
        </div>

        {/* Main Display Area (Split Diagram & Gauges) */}
        <div style={{ display: 'flex', flex: 1, width: '100%', gap: '10px', height: '65%' }}>

          {/* Left: Diagram (Simplified Canvas/SVG) */}
          <div style={{ flex: 2, border: '1px solid #d1d5db', borderRadius: '4px', position: 'relative', background: 'white' }}>
            <Schematic state={state} />
          </div>

          {/* Right: Key Values List - USING DISPLAY (NOISY) VALUES */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            <ValueDisplay label="Reactivity" value={state.display_reactivity.toFixed(1)} unit="%" />
            <ValueDisplay label="Core Temp" value={state.display_core_t.toFixed(1)} unit="°C" alert={state.core_temp_high} />
            <ValueDisplay label="Pri Flow" value={(state.display_pri_flow/1000).toFixed(1)} unit="kL/s" />
            <div style={{ height: '5px' }} />
            <ValueDisplay label="SG Level" value={state.display_sg_level.toFixed(1)} unit="%"
              alert={state.sg_low_level || state.sg_high_level} />
            <ValueDisplay label="Stm Press" value={state.display_steam_press.toFixed(1)} unit="kg/cm²" />
            <ValueDisplay label="FW Flow" value={state.display_fw_flow.toFixed(0)} unit="L/s"
              alert={state.fw_low_flow} />
            <div style={{ height: '5px' }} />
            <ValueDisplay label="Turb Speed" value={state.turbine_rpm.toFixed(0)} unit="rpm" />
          </div>

        </div>

      </div>
      <style>{`
        .alarm-col { display: flex; flexDirection: column; gap: 2px; }
        .alarm-header { font-size: 0.6rem; text-align: center; color: #9ca3af; font-weight: bold; }
      `}</style>
    </>
  );
};

const AlarmTile = ({ label, active }: { label: string, active: boolean }) => (
  <div style={{
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: active ? '#ef4444' : '#374151',
    color: active ? 'white' : '#6b7280',
    fontSize: '0.6rem', fontWeight: 'bold', border: '1px solid #1f2937',
    animation: active ? 'pulse 1s infinite' : 'none',
    textAlign: 'center', minHeight: '20px'
  }}>
    {label}
  </div>
);

const ValueDisplay = ({ label, value, unit, alert = false }: { label: string, value: string, unit: string, alert?: boolean }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '2px 5px',
    backgroundColor: alert ? '#fecaca' : '#f3f4f6',
    border: alert ? '1px solid #ef4444' : '1px solid #e5e7eb',
    borderRadius: '4px', alignItems: 'center'
  }}>
    <span style={{ fontSize: '0.7rem', color: '#374151' }}>{label}</span>
    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace', color: alert ? '#dc2626' : '#111827' }}>
      {value} <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>{unit}</span>
    </span>
  </div>
);

// Simplified SVG Schematic
const Schematic = ({ state }: { state: any }) => {
  // Use display values for visuals too for consistency
  const fwColor = state.display_fw_flow > 100 ? '#3b82f6' : '#d1d5db'; // Blue if flowing
  const steamColor = state.msiv && state.display_steam_press > 10 ? '#ef4444' : '#d1d5db'; // Red if hot steam flowing

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ padding: '5px' }}>
      {/* FW Pump */}
      <circle cx="50" cy="150" r="10" stroke="black" fill={state.fw_pump ? '#22c55e' : '#d1d5db'} />
      <text x="50" y="175" textAnchor="middle" fontSize="8">FW PUMP</text>

      {/* FW Line */}
      <line x1="60" y1="150" x2="100" y2="150" stroke={fwColor} strokeWidth="3" />

      {/* FW IV */}
      <rect x="100" y="140" width="10" height="20" fill={state.fwiv ? '#22c55e' : '#eab308'} stroke="black" />
      <text x="105" y="135" textAnchor="middle" fontSize="8">IV</text>

      {/* Line to CV */}
      <line x1="110" y1="150" x2="140" y2="150" stroke={fwColor} strokeWidth="3" />

      {/* FW CV */}
      <path d="M 140 140 L 150 160 L 160 140 Z" fill="none" stroke="black" />
      <path d="M 140 160 L 150 140 L 160 160 Z" fill="none" stroke="black" />
      <text x="150" y="135" textAnchor="middle" fontSize="8">CV {(state.fwcv_degree*100).toFixed(0)}%</text>

      {/* Line to SG */}
      <line x1="160" y1="150" x2="200" y2="150" stroke={fwColor} strokeWidth="3" />
      <line x1="200" y1="150" x2="200" y2="100" stroke={fwColor} strokeWidth="3" />

      {/* Steam Generator */}
      <rect x="180" y="50" width="40" height="80" rx="5" fill="#e0f2fe" stroke="black" strokeWidth="2" />
      <text x="200" y="110" textAnchor="middle" fontSize="8">SG</text>

      {/* Water Level Visualization - Use Display Level */}
      <rect x="181" y={130 - (state.display_sg_level * 0.8)} width="38" height={state.display_sg_level * 0.8} fill="#3b82f6" opacity="0.5" />

      {/* Steam Line */}
      <line x1="200" y1="50" x2="200" y2="30" stroke={steamColor} strokeWidth="3" />
      <line x1="200" y1="30" x2="250" y2="30" stroke={steamColor} strokeWidth="3" />

      {/* MSIV */}
      <rect x="250" y="20" width="10" height="20" fill={state.msiv ? '#22c55e' : '#eab308'} stroke="black" />
      <text x="255" y="15" textAnchor="middle" fontSize="8">MSIV</text>

      {/* To Turbine */}
      <line x1="260" y1="30" x2="290" y2="30" stroke={steamColor} strokeWidth="3" />
      <text x="290" y="30" textAnchor="end" fontSize="8" alignmentBaseline="middle">Turbine</text>

    </svg>
  );
};
