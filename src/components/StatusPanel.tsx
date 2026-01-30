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

        {/* Annunciator Grid - Kept as is for critical alarms */}
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

  // Dimensions
  const W = 800;
  const H = 500;

  // Formatting helpers
  const fmt = (n: number, d = 0) => n.toFixed(d);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ background: '#020617' }}>

      {/* --------------------------------------------------------------------------
          COMPONENTS (Blocks)
         -------------------------------------------------------------------------- */}

      {/* Reactor */}
      <rect x="50" y="120" width="120" height="260" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="110" y="250" textAnchor="middle" fill={cBorder} fontSize="18" fontWeight="bold">REACTOR</text>

      {/* Steam Generator (SG) */}
      <rect x="300" y="120" width="100" height="260" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="350" y="250" textAnchor="middle" fill={cBorder} fontSize="18" fontWeight="bold">SG</text>

      {/* Turbine Block */}
      <rect x="600" y="80" width="150" height="180" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="675" y="170" textAnchor="middle" fill={cBorder} fontSize="18" fontWeight="bold">TURBINE</text>

      {/* Condenser Block (Attached below Turbine) */}
      <rect x="600" y="260" width="150" height="100" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="675" y="310" textAnchor="middle" fill={cBorder} fontSize="16">CONDENSER</text>


      {/* --------------------------------------------------------------------------
          PIPING LAYOUT
         -------------------------------------------------------------------------- */}

      {/* Primary Loop: Reactor <-> SG */}
      {/* Hot Leg (Top) */}
      <path d="M 170 180 L 300 180" fill="none" stroke={cPipeHot} strokeWidth="8" />
      {/* Cold Leg (Bottom) */}
      <path d="M 300 320 L 170 320" fill="none" stroke={cPipeCold} strokeWidth="8" />


      {/* Steam Lines */}
      {/* SG Top -> Header */}
      <path d="M 350 120 L 350 60 L 520 60 L 520 300" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Branches to Turbine/Condenser */}
      {/* Speed CV Line */}
      <path d="M 520 120 L 600 120" fill="none" stroke="#f8fafc" strokeWidth="4" />
      {/* Load CV Line */}
      <path d="M 520 180 L 600 180" fill="none" stroke="#f8fafc" strokeWidth="4" />
      {/* Bypass CV Line -> Condenser */}
      <path d="M 520 290 L 600 290" fill="none" stroke="#f8fafc" strokeWidth="4" />


      {/* Feedwater Return */}
      {/* Condenser Bottom -> Pump */}
      <path d="M 675 360 L 675 420 L 550 420" fill="none" stroke={cPipeCold} strokeWidth="6" />
      {/* Pump -> Valves -> SG Bottom */}
      <path d="M 550 420 L 350 420 L 350 380" fill="none" stroke={cPipeCold} strokeWidth="6" />


      {/* --------------------------------------------------------------------------
          VALVES & PUMPS
         -------------------------------------------------------------------------- */}

      {/* RCP (On Cold Leg) */}
      <circle cx="235" cy="320" r="15" fill={state.rcp ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="235" y="355" textAnchor="middle" fill="#94a3b8" fontSize="10">RCP</text>

      {/* MSIV (On Steam Exit) */}
      <Valve x={350} y={90} open={state.msiv} label="MSIV" vertical={true} />

      {/* Speed CV */}
      <Valve x={560} y={120} open={true} label="Speed CV" scale={0.8} vertical={false} />
      {/* Load CV */}
      <Valve x={560} y={180} open={true} label="Load CV" scale={0.8} vertical={false} />
      {/* Bypass CV */}
      <Valve x={560} y={290} open={false} label="Bypass" scale={0.8} vertical={false} />

      {/* FW Pump */}
      <circle cx="500" cy="420" r="15" fill={state.fw_pump ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="500" y="455" textAnchor="middle" fill="#94a3b8" fontSize="10">FW PUMP</text>

      {/* FW Valves */}
      <Valve x={450} y={420} open={state.fwiv} label="FW IV" vertical={false} />
      <Valve x={400} y={420} open={state.fwcv_degree > 0} label="FW CV" vertical={false} type="control" />


      {/* --------------------------------------------------------------------------
          DIGITAL DISPLAYS
         -------------------------------------------------------------------------- */}

      {/* Reactivity (Top Left) */}
      <DigitalGauge x={50} y={40} label="Reactivity" value={fmt(state.display_reactivity, 1)} unit="pcm" />
      {/* Core Temp (Top Left) */}
      <DigitalGauge x={160} y={40} label="Core Temp" value={fmt(state.display_core_t, 1)} unit="°C" />

      {/* Steam Press (Top Center) */}
      <DigitalGauge x={400} y={20} label="Steam Press" value={fmt(state.display_steam_press, 1)} unit="kg/cm²" />

      {/* Turbine Speed (Top Right) */}
      <DigitalGauge x={625} y={40} label="Turbine Spd" value={fmt(state.turbine_rpm, 0)} unit="rpm" />

      {/* SG Level (On SG) */}
      <DigitalGauge x={250} y={200} label="Steam Gen Lvl" value={fmt(state.display_sg_level, 1)} unit="%"
          warn={state.sg_low_level || state.sg_high_level}
          compact={true}
      />

      {/* Primary Flow (Below Reactor) */}
      <DigitalGauge x={50} y={400} label="Primary Flow" value={fmt(state.display_pri_flow/1000, 1)} unit="kL/s" />

      {/* FW Flow (Below FW Line) */}
      <DigitalGauge x={350} y={440} label="FW Flow" value={fmt(state.display_fw_flow, 0)} unit="L/s"
          warn={state.fw_low_flow}
      />

    </svg>
  );
};

// ----------------------------------------------------------------------------
// SVG Helpers
// ----------------------------------------------------------------------------

const DigitalGauge = ({ x, y, label, value, unit, warn = false, compact = false }: any) => {
    const w = compact ? 80 : 100;
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

const Valve = ({ x, y, open, label, vertical = true, scale = 1, type = 'gate' }: any) => {
    const cBody = "#94a3b8";
    const cFill = open ? "#22c55e" : "#ef4444";

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
                <text x="0" y="-30" textAnchor="middle" fontSize="10" fill="#cbd5e1">{label}</text>
            )}
        </g>
    );
};
