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

        {/* Annunciator Grid (3x3) */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)'
        }}>
            <AlarmTile label="CORE T HIGH" active={state.core_temp_high} />
            <AlarmTile label="SI ENGAGED" active={state.safety_injection_engaged} />
            <AlarmTile label="RODS DOWN" active={state.all_rods_down} />

            <AlarmTile label="RCP TRIP" active={state.reactor_coolant_pump_trip} />
            <AlarmTile label="SG HI LEVEL" active={state.sg_high_level} />
            <AlarmTile label="SG LO LEVEL" active={state.sg_low_level} />

            <AlarmTile label="FW LO FLOW" active={state.fw_low_flow} />
            <AlarmTile label="FW PUMP TRIP" active={state.fw_pump_trip} />
            <AlarmTile label="TURBINE TRIP" active={state.turbine_trip} />
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
  <div className={`annunciator-tile ${active ? 'active' : ''}`} style={{ height: '32px', fontSize: '0.7rem' }}>
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
  const W = 900;
  const H = 550;

  // Formatting helpers
  const fmt = (n: number, d = 0) => n.toFixed(d);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ background: '#020617' }}>

      {/* --------------------------------------------------------------------------
          COMPONENTS (Blocks)
         -------------------------------------------------------------------------- */}

      {/* Reactor: 50, 180, 140w, 230h. Center X = 120 */}
      <rect x="50" y="180" width="140" height="230" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="120" y="300" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Reactor</text>

      {/* Steam Generator (SG) */}
      <rect x="300" y="180" width="120" height="230" rx="4" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="360" y="300" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Steam Generator</text>

      {/* Turbine Block */}
      {/* y=50, h=200 -> Bottom=250 */}
      <rect x="650" y="50" width="200" height="200" rx="0" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="750" y="155" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Turbine</text>

      {/* Condenser Block (Attached below Turbine) */}
      {/* y=250. Connected. */}
      <rect x="650" y="250" width="200" height="150" rx="0" fill={cComponent} stroke={cBorder} strokeWidth="3" />
      <text x="750" y="325" textAnchor="middle" fill={cBorder} fontSize="20" fontWeight="bold">Condenser</text>

      {/* Mask the border between Turbine and Condenser to make them look unified */}
      <line x1="653" y1="250" x2="847" y2="250" stroke={cComponent} strokeWidth="4" />


      {/* --------------------------------------------------------------------------
          PIPING LAYOUT
         -------------------------------------------------------------------------- */}

      {/* Primary Loop: Reactor <-> SG */}
      {/* Hot Leg (Top) */}
      <path d="M 190 220 L 300 220" fill="none" stroke={cPipeHot} strokeWidth="8" />
      {/* Cold Leg (Bottom) */}
      <path d="M 300 380 L 190 380" fill="none" stroke={cPipeCold} strokeWidth="8" />


      {/* Steam Lines */}
      {/* SG Top -> MSIV -> Header */}
      {/* SG Top (360, 180) -> Up to MSIV (360, 120) -> Up to Header (360, 80) -> Right */}
      <path d="M 360 180 L 360 80 L 480 80" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Header Vertical Distribution */}
      <path d="M 480 80 L 480 300" fill="none" stroke="#f8fafc" strokeWidth="6" />

      {/* Speed CV Branch (TSCV) - y=100 */}
      <path d="M 480 100 L 650 100" fill="none" stroke="#f8fafc" strokeWidth="4" />

      {/* Load CV Branch (TLCV) - Moved to y=200 for uniform spacing */}
      <path d="M 480 200 L 650 200" fill="none" stroke="#f8fafc" strokeWidth="4" />

      {/* Bypass CV Branch (TBCV) - y=300 */}
      <path d="M 480 300 L 650 300" fill="none" stroke="#f8fafc" strokeWidth="4" />


      {/* Feedwater Return */}
      {/* Condenser Bottom -> Pump (Moved down to y=530 to create MORE space for FW Flow Gauge) */}
      <path d="M 750 400 L 750 530 L 550 530" fill="none" stroke={cPipeCold} strokeWidth="6" />
      {/* Pump -> Valves -> SG Bottom */}
      <path d="M 550 530 L 360 530 L 360 410" fill="none" stroke={cPipeCold} strokeWidth="6" />


      {/* --------------------------------------------------------------------------
          VALVES & PUMPS
         -------------------------------------------------------------------------- */}

      {/* Reactor Coolant Pump (RCP) - Positioned to the right of Primary Flow */}
      <circle cx="245" cy="380" r="18" fill={state.rcp ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="245" y="440" textAnchor="middle" fill="#94a3b8" fontSize="12">
        RCP
        <title>RCP (Reactor Cooler Pump)</title>
      </text>

      {/* Main Steam Isolation Valve (MSIV) - Vertically above SG */}
      <Valve x={360} y={130} open={state.msiv} label="MSIV" fullName="MSIV (Main Steam Isolation Valve)" vertical={true} labelY={-10} labelOffset={40} />

      {/* Steam Pressure - Between MSIV and TSCV/Header. X=440. Moved Y up slightly to avoid MSIV label clash. */}
      <DigitalGauge x={440} y={35} label="Steam Pressure" value={fmt(state.display_steam_press, 1)} unit="kg/cm²" width={100} fullName="(Steam Pressure)" />

      {/* Turbine Speed Control Valve - y=100 */}
      <Valve x={550} y={100} open={true} label="TSCV" fullName="TSCV (Turbine Speed Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Turbine Load Control Valve - y=200 */}
      <Valve x={550} y={200} open={true} label="TLCV" fullName="TLCV (Turbin Load Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Turbine Bypass Control Valve - y=300 */}
      <Valve x={550} y={300} open={false} label="TBCV" fullName="TBCV (Turbine Bypass Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Feedwater Pump - Moved to y=530 */}
      <circle cx="500" cy="530" r="18" fill={state.fw_pump ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="500" y="565" textAnchor="middle" fill="#94a3b8" fontSize="12">
          FWP
          <title>FWP (Feedwater Pump)</title>
      </text>

      {/* Feedwater Isolation Valve - Moved to y=530 */}
      <Valve x={420} y={530} open={state.fwiv} label="FWIV" fullName="FWIV (Feedwater Isolation Valve)" vertical={false} labelY={-25} />

      {/* Feedwater Control Valve - Moved to y=490 to make room for gauge */}
      {/* Moving FWCV slightly lower or ensuring gauge is high enough */}
      <Valve x={360} y={490} open={state.fwcv_degree > 0} label="FWCV" fullName="FWCV (Feedwater Control Valve)" vertical={true} type="control" labelOffset={40} />


      {/* --------------------------------------------------------------------------
          DIGITAL DISPLAYS (Instruments)
         -------------------------------------------------------------------------- */}

      {/* Reactivity (Top Left) - Moved Above Reactor (x=50, w=140). Gauge Width=80/100. */}
      {/* Moved Y to 110 to ensure clear separation from Reactor top (y=180) */}
      <DigitalGauge x={40} y={110} label="Reactivity" value={fmt(state.display_reactivity, 1)} unit="pcm" width={90} fullName="(Reactivity)" />

      {/* Core Temp (Top Left) - Moved Above Reactor */}
      <DigitalGauge x={140} y={110} label="Core Temp" value={fmt(state.display_core_t, 1)} unit="°C" width={90} fullName="(Core Temperature)" />

      {/* Turbine Speed (Top Right) */}
      <DigitalGauge x={700} y={20} label="Turbine Spd" value={fmt(state.turbine_rpm, 0)} unit="rpm" width={100} fullName="(Turbine Speed)" />

      {/* SG Level (On SG) */}
      <DigitalGauge x={310} y={230} label="SG Level" value={fmt(state.display_sg_level, 1)} unit="%"
          warn={state.sg_low_level || state.sg_high_level}
          compact={true}
          fullName="(Steam Generator Level)"
      />

      {/* Primary Flow (Between Reactor and RCP) */}
      {/* Reactor Right X=190. RCP X=245. Center ~217. Y=330. */}
      {/* Pipe Y=380. 330 + 50 (height) = 380. Touches pipe. Move up to 310. */}
      <DigitalGauge x={175} y={310} label="Primary Flow" value={fmt(state.display_pri_flow/1000, 1)} unit="kL/s" width={90} fullName="(Primary Flow)" />

      {/* Feedwater Flow (Between SG and FWCV) */}
      {/* SG Bottom y=410. FWCV y=490. Distance=80px. Gauge H=50. */}
      {/* If gauge at y=420: Bottom=470. FWCV top (y=490-15=475). Very close. */}
      {/* Let's move Gauge to y=420. FWCV is at y=490. */}
      <DigitalGauge x={320} y={420} label="FW Flow" value={fmt(state.display_fw_flow, 0)} unit="L/s"
          warn={state.fw_low_flow} width={80} compact={true} fullName="(Feedwater Flow)"
      />

    </svg>
  );
};

// ----------------------------------------------------------------------------
// SVG Helpers
// ----------------------------------------------------------------------------

const DigitalGauge = ({ x, y, label, value, unit, warn = false, compact = false, width, fullName }: any) => {
    const w = width || (compact ? 80 : 100);
    return (
        <g transform={`translate(${x}, ${y})`}>
            <title>{fullName}</title>
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

const Valve = ({ x, y, open, label, vertical = true, scale = 1, type = 'gate', labelY, labelOffset, fullName }: any) => {
    const cBody = "#94a3b8";
    const cFill = open ? "#22c55e" : "#ef4444";

    // Default label pos
    const ly = labelY || -30;
    const lx = labelOffset || 0;

    return (
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            <title>{fullName}</title>
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
