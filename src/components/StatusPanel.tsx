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
      <div className="panel-content" style={{ flexDirection: 'column', width: '100%', padding: '10px' }}>

        {/* Alarms Header */}
        <div style={{ display: 'flex', gap: '5px', width: '100%', marginBottom: '10px' }}>
          <AlarmTile label="FW LOW FLOW" active={state.alarms.includes('FW LOW FLOW')} />
          <AlarmTile label="SG LOW LEVEL" active={state.alarms.includes('SG LOW LEVEL')} />
          <AlarmTile label="SG HIGH LEVEL" active={state.alarms.includes('SG HIGH LEVEL')} />
          <AlarmTile label="RX TRIP" active={state.alarms.includes('RX TRIPPED')} />
        </div>

        {/* Main Display Area (Split Diagram & Gauges) */}
        <div style={{ display: 'flex', flex: 1, width: '100%', gap: '10px' }}>

          {/* Left: Diagram (Simplified Canvas/SVG) */}
          <div style={{ flex: 2, border: '1px solid #d1d5db', borderRadius: '4px', position: 'relative', background: 'white' }}>
            <Schematic state={state} />
          </div>

          {/* Right: Key Values List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <ValueDisplay label="Reactor Power" value={state.reactor_power.toFixed(1)} unit="%" />
            <ValueDisplay label="Turbine Speed" value={state.turbine_speed.toFixed(0)} unit="rpm" />
            <div style={{ height: '10px' }} />
            <ValueDisplay label="SG Level" value={state.sg_level.toFixed(1)} unit="%"
              alert={state.alarms.includes('SG LOW LEVEL') || state.alarms.includes('SG HIGH LEVEL')} />
            <ValueDisplay label="SG Pressure" value={state.sg_pressure.toFixed(2)} unit="MPa" />
            <ValueDisplay label="FW Flow" value={state.fw_flow.toFixed(0)} unit="kg/s"
              alert={state.alarms.includes('FW LOW FLOW')} />
          </div>

        </div>

      </div>
    </>
  );
};

const AlarmTile = ({ label, active }: { label: string, active: boolean }) => (
  <div style={{
    flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: active ? '#ef4444' : '#374151',
    color: active ? 'white' : '#6b7280',
    fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid #1f2937',
    animation: active ? 'pulse 1s infinite' : 'none',
    textAlign: 'center'
  }}>
    {label}
  </div>
);

const ValueDisplay = ({ label, value, unit, alert = false }: { label: string, value: string, unit: string, alert?: boolean }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '5px 10px',
    backgroundColor: alert ? '#fecaca' : '#f3f4f6',
    border: alert ? '1px solid #ef4444' : '1px solid #e5e7eb',
    borderRadius: '4px', alignItems: 'center'
  }}>
    <span style={{ fontSize: '0.8rem', color: '#374151' }}>{label}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'monospace', color: alert ? '#dc2626' : '#111827' }}>
      {value} <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{unit}</span>
    </span>
  </div>
);

// Simplified SVG Schematic
const Schematic = ({ state }: { state: any }) => {
  // Simple logic to determine line colors based on flow/state
  const fwColor = state.fw_flow > 100 ? '#3b82f6' : '#d1d5db'; // Blue if flowing
  const steamColor = state.msiv_open && state.sg_pressure > 1 ? '#ef4444' : '#d1d5db'; // Red if hot steam flowing

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ padding: '10px' }}>
      {/* FW Pump */}
      <circle cx="50" cy="150" r="10" stroke="black" fill={state.fw_pump_on ? '#22c55e' : '#d1d5db'} />
      <text x="50" y="175" textAnchor="middle" fontSize="8">FW PUMP</text>

      {/* FW Line */}
      <line x1="60" y1="150" x2="100" y2="150" stroke={fwColor} strokeWidth="3" />

      {/* FW IV */}
      <rect x="100" y="140" width="10" height="20" fill={state.fw_iv_open ? '#22c55e' : '#eab308'} stroke="black" />
      <text x="105" y="135" textAnchor="middle" fontSize="8">IV</text>

      {/* Line to CV */}
      <line x1="110" y1="150" x2="140" y2="150" stroke={fwColor} strokeWidth="3" />

      {/* FW CV */}
      <path d="M 140 140 L 150 160 L 160 140 Z" fill="none" stroke="black" />
      <path d="M 140 160 L 150 140 L 160 160 Z" fill="none" stroke="black" />
      <text x="150" y="135" textAnchor="middle" fontSize="8">CV {(state.fw_cv*100).toFixed(0)}%</text>

      {/* Line to SG */}
      <line x1="160" y1="150" x2="200" y2="150" stroke={fwColor} strokeWidth="3" />
      <line x1="200" y1="150" x2="200" y2="100" stroke={fwColor} strokeWidth="3" />

      {/* Steam Generator */}
      <rect x="180" y="50" width="40" height="80" rx="5" fill="#e0f2fe" stroke="black" strokeWidth="2" />
      <text x="200" y="110" textAnchor="middle" fontSize="8">SG</text>

      {/* Water Level Visualization */}
      <rect x="181" y={130 - (state.sg_level * 0.8)} width="38" height={state.sg_level * 0.8} fill="#3b82f6" opacity="0.5" />

      {/* Steam Line */}
      <line x1="200" y1="50" x2="200" y2="30" stroke={steamColor} strokeWidth="3" />
      <line x1="200" y1="30" x2="250" y2="30" stroke={steamColor} strokeWidth="3" />

      {/* MSIV */}
      <rect x="250" y="20" width="10" height="20" fill={state.msiv_open ? '#22c55e' : '#eab308'} stroke="black" />
      <text x="255" y="15" textAnchor="middle" fontSize="8">MSIV</text>

      {/* To Turbine */}
      <line x1="260" y1="30" x2="290" y2="30" stroke={steamColor} strokeWidth="3" />
      <text x="290" y="30" textAnchor="end" fontSize="8" alignmentBaseline="middle">Turbine</text>

    </svg>
  );
};
