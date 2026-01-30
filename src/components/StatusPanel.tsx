import { useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';

export const StatusPanel = () => {
  const state = useSimulationStore();

  // Setup Tick Loop (independent of visual refresh, but keeps store ticking)
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

            <div className="annunciator-col">
                <div className="annunciator-header">SECONDARY</div>
                <AlarmTile label="SG HI LEVEL" active={state.sg_high_level} />
                <AlarmTile label="SG LO LEVEL" active={state.sg_low_level} />
                <AlarmTile label="FW LO FLOW" active={state.fw_low_flow} />
                <AlarmTile label="FW PUMP TRIP" active={state.fw_pump_trip} />
                <AlarmTile label="LO TB PRESS" active={state.low_turbine_pressure} />
                <AlarmTile label="MS RAD MON" active={state.ms_rad_monitor} />
            </div>

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

        {/* Main Schematic Area */}
        <div style={{ flex: 1, width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
            <SchematicView state={state} />
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

// ----------------------------------------------------------------------------
// Schematic View
// ----------------------------------------------------------------------------

const SchematicView = ({ state }: { state: any }) => {
  // Colors
  const cPipeHot = "#ef4444"; // Red
  const cPipeCold = "#3b82f6"; // Blue
  const cComponent = "#1e293b"; // Slate 800
  const cBorder = "#94a3b8"; // Slate 400
  const cValveOpen = "#22c55e"; // Green
  const cValveClosed = "#ef4444"; // Red

  // Dimensions
  const W = 900; // Increased width for labels
  const H = 550;

  // Formatting helpers
  const fmt = (n: number, d = 0) => n.toFixed(d);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ background: '#020617' }}>

      {/* --------------------------------------------------------------------------
          COMPONENTS (Blocks)
         -------------------------------------------------------------------------- */}

      {/* Reactor */}
      <rect x="50" y="150" width="140" height="260" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="120" y="285" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Reactor</text>

      {/* Steam Generator (SG) */}
      <rect x="300" y="150" width="120" height="260" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="360" y="285" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Steam Generator</text>

      {/* Turbine Block */}
      <rect x="650" y="50" width="200" height="200" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="750" y="155" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Turbine</text>

      {/* Condenser Block (Attached below Turbine) */}
      <rect x="650" y="260" width="200" height="150" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="750" y="340" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Condenser</text>


      {/* --------------------------------------------------------------------------
          PIPING LAYOUT
         -------------------------------------------------------------------------- */}

      {/* Primary Loop: Reactor <-> SG */}
      {/* Hot Leg (Top) */}
      <path d="M 190 200 L 300 200" fill="none" stroke={cPipeHot} strokeWidth="8" />
      {/* Cold Leg (Bottom) */}
      <path d="M 300 360 L 190 360" fill="none" stroke={cPipeCold} strokeWidth="8" />


      {/* Steam Lines */}
      {/* SG Top -> MSIV -> Header */}
      <path d="M 360 150 L 360 80 L 480 80" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Header Vertical Distribution */}
      <path d="M 480 80 L 480 300" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Speed CV Branch */}
      <path d="M 480 100 L 650 100" fill="none" stroke="#f8fafc" strokeWidth="4" />
      {/* Load CV Branch */}
      <path d="M 480 160 L 650 160" fill="none" stroke="#f8fafc" strokeWidth="4" />
      {/* Bypass CV Branch -> Condenser */}
      <path d="M 480 300 L 650 300" fill="none" stroke="#f8fafc" strokeWidth="4" />


      {/* Feedwater Return */}
      {/* Condenser Bottom -> Pump */}
      <path d="M 750 410 L 750 480 L 550 480" fill="none" stroke={cPipeCold} strokeWidth="6" />
      {/* Pump -> Valves -> SG Bottom */}
      <path d="M 550 480 L 360 480 L 360 410" fill="none" stroke={cPipeCold} strokeWidth="6" />


      {/* --------------------------------------------------------------------------
          VALVES & PUMPS
         -------------------------------------------------------------------------- */}

      {/* Reactor Coolant Pump (On Cold Leg) */}
      <circle cx="245" cy="360" r="18" fill={state.rcp ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="245" y="400" textAnchor="middle" fill="#94a3b8" fontSize="12">Reactor Coolant Pump</text>

      {/* Main Steam Isolation Valve (MSIV) */}
      <Valve x={420} y={80} open={state.msiv} label="Main Steam Isolation Valve" vertical={false} labelY={-35} />

      {/* Turbine Speed Control Valve */}
      <Valve x={550} y={100} open={true} label="Turbine Speed Control Valve" scale={0.8} vertical={false} labelY={-25} />
      {/* Turbine Load Control Valve */}
      <Valve x={550} y={160} open={true} label="Turbine Load Control Valve" scale={0.8} vertical={false} labelY={-25} />
      {/* Turbine Bypass Control Valve */}
      <Valve x={550} y={300} open={false} label="Turbine Bypass Control Valve" scale={0.8} vertical={false} labelY={-25} />

      {/* Feedwater Pump */}
      <circle cx="500" cy="480" r="18" fill={state.fw_pump ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="500" y="525" textAnchor="middle" fill="#94a3b8" fontSize="12">Feedwater Pump</text>

      {/* Feedwater Isolation Valve */}
      <Valve x={420} y={480} open={state.fwiv} label="Feedwater Isolation Valve" vertical={false} labelY={25} />

      {/* Feedwater Control Valve */}
      <Valve x={360} y={450} open={state.fwcv_degree > 0} label="Feedwater Control Valve" vertical={true} type="control" labelOffset={40} />


      {/* --------------------------------------------------------------------------
          DIGITAL DISPLAYS (Instruments)
         -------------------------------------------------------------------------- */}

      {/* Reactivity (Top Left) */}
      <DigitalGauge x={50} y={50} label="Reactivity" value={fmt(state.display_reactivity, 1)} unit="pcm" />
      {/* Core Temp (Top Left) */}
      <DigitalGauge x={180} y={50} label="Core Temperature" value={fmt(state.display_core_t, 1)} unit="°C" width={130} />

      {/* Steam Pressure (Top Center) */}
      <DigitalGauge x={350} y={20} label="Steam Pressure" value={fmt(state.display_steam_press, 1)} unit="kg/cm²" width={120} />

      {/* Turbine Speed (Top Right) */}
      <DigitalGauge x={700} y={20} label="Turbine Speed" value={fmt(state.turbine_rpm, 0)} unit="rpm" width={120} />

      {/* SG Level (On SG) */}
      <DigitalGauge x={310} y={200} label="SG Level" value={fmt(state.display_sg_level, 1)} unit="%"
          warn={state.sg_low_level || state.sg_high_level}
          compact={true}
      />

      {/* Primary Flow (Below Reactor) */}
      <DigitalGauge x={50} y={440} label="Primary Flow" value={fmt(state.display_pri_flow/1000, 1)} unit="kL/s" width={120} />

      {/* Feedwater Flow (Near FW Line) */}
      <DigitalGauge x={230} y={480} label="Feedwater Flow" value={fmt(state.display_fw_flow, 0)} unit="L/s"
          warn={state.fw_low_flow} width={120}
      />

    </svg>
  );
};

// ----------------------------------------------------------------------------
// SVG Helpers
// ----------------------------------------------------------------------------

const DigitalGauge = ({ x, y, label, value, unit, warn = false, compact = false, width }: any) => {
    const w = width || (compact ? 80 : 100);
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Label Background */}
            <rect x="0" y="0" width={w} height="20" fill="#333" />
            <text x={w/2} y="14" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">{label}</text>

            {/* Value Background */}
            <rect x="0" y="20" width={w} height="30" fill="#000" stroke={warn ? "#ef4444" : "#22c55e"} strokeWidth={warn ? 2 : 0} />
            <text x={w/2} y="42" textAnchor="middle" fill={warn ? "#ef4444" : "#22c55e"} fontSize="16" fontWeight="bold" fontFamily="monospace">
                {value} <tspan fontSize="9" fill="#666">{unit}</tspan>
            </text>
        </g>
    );
};

const Valve = ({ x, y, open, label, vertical = true, scale = 1, type = 'gate', labelY, labelOffset }: any) => {
    const cBody = "#94a3b8";
    const cFill = open ? "#22c55e" : "#ef4444";

    // Default label pos
    const ly = labelY || -30;
    const lx = labelOffset || 0;

    return (
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            {/* Valve Symbol (Bowtie) */}
            <path d="M -10 -10 L 10 10 L 10 -10 L -10 10 Z" fill={cFill} stroke="black" strokeWidth="1" transform={vertical ? "rotate(90)" : ""} />

            {/* Stem & Actuator */}
            <line x1="0" y1="0" x2="0" y2="-15" stroke={cBody} strokeWidth="2" />
            {type === 'control' ? (
                <path d="M -10 -25 A 10 10 0 0 1 10 -25" fill="none" stroke={cBody} strokeWidth="2" />
            ) : (
                <line x1="-8" y1="-15" x2="8" y2="-15" stroke={cBody} strokeWidth="4" />
            )}

            {/* Label */}
            {label && (
                <text x={lx} y={ly} textAnchor="middle" fontSize="12" fill="#cbd5e1" fontWeight="normal">{label}</text>
            )}
        </g>
    );
};
