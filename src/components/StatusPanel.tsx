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
          PIPING LAYOUT
         -------------------------------------------------------------------------- */}

      {/* Primary Loop: Reactor -> SG */}
      <path d="M 200 200 L 350 200 L 350 180" fill="none" stroke={cPipeHot} strokeWidth="8" />

      {/* Primary Loop: SG -> Pump -> Reactor */}
      <path d="M 350 350 L 350 380 L 200 380" fill="none" stroke={cPipeCold} strokeWidth="8" />

      {/* Steam Line: SG -> MSIV -> Header */}
      <path d="M 400 150 L 400 100 L 550 100" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Header split to Turbine Valves */}
      <path d="M 550 100 L 550 240" fill="none" stroke="#f8fafc" strokeWidth="4" /> {/* Main Vertical Header */}

      {/* Speed CV -> Turbine */}
      <path d="M 550 160 L 620 160 L 650 160" fill="none" stroke="#f8fafc" strokeWidth="4" />

      {/* Load CV -> Turbine */}
      <path d="M 550 200 L 620 200 L 650 200" fill="none" stroke="#f8fafc" strokeWidth="4" />

      {/* Bypass -> Condenser */}
      <path d="M 550 240 L 620 240 L 680 240 L 680 350" fill="none" stroke="#f8fafc" strokeWidth="4" />


      {/* Feedwater Line: Condenser -> Pump -> Valves -> SG */}
      {/* Condenser Out */}
      <path d="M 700 400 L 700 430 L 600 430" fill="none" stroke={cPipeCold} strokeWidth="6" />
      {/* Pump to Valves (shifted right) */}
      <path d="M 560 430 L 550 430" fill="none" stroke={cPipeCold} strokeWidth="6" />
      {/* Up to SG (shifted right) */}
      <path d="M 500 430 L 420 430 L 420 300" fill="none" stroke={cPipeCold} strokeWidth="6" />


      {/* --------------------------------------------------------------------------
          COMPONENTS
         -------------------------------------------------------------------------- */}

      {/* Reactor Container */}
      <rect x="50" y="100" width="150" height="300" rx="20" fill={cComponent} stroke={cBorder} strokeWidth="4" />
      <text x="125" y="250" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Reactor</text>

      {/* Steam Generator */}
      <rect x="320" y="150" width="100" height="200" rx="15" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="370" y="250" textAnchor="middle" fill={cBorder} fontSize="16" fontWeight="bold">SG</text>
      {/* SG Internal Coils (Visual) */}
      <path d="M 350 200 Q 330 250 350 300 Q 370 250 350 200" fill="none" stroke={cPipeHot} strokeWidth="4" opacity="0.5" />

      {/* Turbine */}
      <rect x="650" y="120" width="120" height="200" rx="10" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="710" y="220" textAnchor="middle" fill={cBorder} fontSize="18" fontWeight="bold">Turbine</text>

      {/* Condenser */}
      <path d="M 650 350 L 770 350 Q 770 400 710 420 Q 650 400 650 350" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="710" y="380" textAnchor="middle" fill={cBorder} fontSize="14">Condenser</text>


      {/* PUMPS */}
      {/* RCP (Reactor Coolant Pump) */}
      <circle cx="300" cy="380" r="15" fill={state.rcp ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="300" y="415" textAnchor="middle" fill="#94a3b8" fontSize="10">RCP</text>

      {/* FW Pump */}
      <circle cx="580" cy="430" r="15" fill={state.fw_pump ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="580" y="465" textAnchor="middle" fill="#94a3b8" fontSize="10">FW PUMP</text>


      {/* VALVES */}
      {/* MSIV */}
      <Valve x={400} y={125} open={state.msiv} label="MSIV" vertical={true} />

      {/* Turbine Valves (Visual only, mapped to CVs?) */}
      <Valve x={620} y={160} open={true} label="Speed CV" scale={0.7} />
      <Valve x={620} y={200} open={true} label="Load CV" scale={0.7} />
      <Valve x={620} y={240} open={false} label="Bypass" scale={0.7} vertical={false} />

      {/* FW Isolation (Shifted Right) */}
      <Valve x={530} y={430} open={state.fwiv} label="FW IV" vertical={false} />

      {/* FW Control (Shifted Right) */}
      <Valve x={480} y={430} open={state.fwcv_degree > 0} label={`FW CV ${(state.fwcv_degree*100).toFixed(0)}%`} vertical={false} type="control" />


      {/* --------------------------------------------------------------------------
          DISPLAYS (Green Digital Style)
         -------------------------------------------------------------------------- */}

      {/* 1. Reactivity */}
      <DigitalGauge x={40} y={40} label="Reactivity" value={fmt(state.display_reactivity, 1)} unit="pcm" />

      {/* 2. Core Temp */}
      <DigitalGauge x={150} y={40} label="Core Temp" value={fmt(state.display_core_t, 1)} unit="°C" />

      {/* 3. Primary Flow (Near RCP Loop) */}
      <DigitalGauge x={180} y={390} label="Primary Flow" value={fmt(state.display_pri_flow/1000, 1)} unit="kL/s" />

      {/* 4. SG Level (On SG) */}
      <DigitalGauge x={320} y={200} label="Steam Gen Lvl" value={fmt(state.display_sg_level, 1)} unit="%"
          warn={state.sg_low_level || state.sg_high_level}
      />

      {/* 5. Steam Pressure (Top Line) */}
      <DigitalGauge x={460} y={40} label="Steam Press" value={fmt(state.display_steam_press, 1)} unit="kg/cm²" />

      {/* 6. FW Flow (Bottom Line - Shifted Right) */}
      <DigitalGauge x={370} y={390} label="FW Flow" value={fmt(state.display_fw_flow, 0)} unit="L/s"
          warn={state.fw_low_flow}
      />

      {/* 7. Turbine Speed */}
      <DigitalGauge x={650} y={40} label="Turbine Spd" value={fmt(state.turbine_rpm, 0)} unit="rpm" />

    </svg>
  );
};

// ----------------------------------------------------------------------------
// SVG Helpers
// ----------------------------------------------------------------------------

const DigitalGauge = ({ x, y, label, value, unit, warn = false }: { x: number, y: number, label: string, value: string, unit: string, warn?: boolean }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Label Background */}
            <rect x="0" y="0" width="100" height="20" fill="#333" />
            <text x="50" y="14" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">{label}</text>

            {/* Value Background */}
            <rect x="0" y="20" width="100" height="30" fill="#000" stroke={warn ? "#ef4444" : "#22c55e"} strokeWidth={warn ? 2 : 0} />
            <text x="50" y="42" textAnchor="middle" fill={warn ? "#ef4444" : "#22c55e"} fontSize="18" fontWeight="bold" fontFamily="monospace">
                {value} <tspan fontSize="10" fill="#666">{unit}</tspan>
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
