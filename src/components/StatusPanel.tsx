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
  // Increased height to prevent clipping
  const H = 600;

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
      {/* NO TOOLTIP */}
      <DigitalGauge x={440} y={35} label="Steam Pressure" value={fmt(state.display_steam_press, 1)} unit="kg/cm²" width={100} />

      {/* Turbine Speed Control Valve - y=100 */}
      <Valve x={550} y={100} open={true} label="TSCV" fullName="TSCV (Turbine Speed Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Turbine Load Control Valve - y=200 */}
      <Valve x={550} y={200} open={true} label="TLCV" fullName="TLCV (Turbin Load Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Turbine Bypass Control Valve - y=300 */}
      <Valve x={550} y={300} open={false} label="TBCV" fullName="TBCV (Turbine Bypass Control Valve)" scale={0.8} vertical={false} labelY={-20} />

      {/* Feedwater Pump - Shifted Right to cx=540 (was 500) */}
      <circle cx="540" cy="530" r="18" fill={state.fw_pump ? cValveOpen : cComponent} stroke={cBorder} strokeWidth="2" />
      <text x="540" y="565" textAnchor="middle" fill="#94a3b8" fontSize="12">
          FWP
          <title>FWP (Feedwater Pump)</title>
      </text>

      {/* Feedwater Isolation Valve - Moved to y=530 */}
      <Valve x={420} y={530} open={state.fwiv} label="FWIV" fullName="FWIV (Feedwater Isolation Valve)" vertical={false} labelY={-25} />

      {/* Feedwater Control Valve - MOVED to y=500. Same shape as others. Rotates based on degree. */}
      <Valve
        x={360} y={500}
        open={state.fwcv_degree > 0.05}
        label="FWCV"
        fullName="FWCV (Feedwater Control Valve)"
        vertical={true}
        labelOffset={40}
      />


      {/* --------------------------------------------------------------------------
          DIGITAL DISPLAYS (Instruments)
         -------------------------------------------------------------------------- */}

      {/* Reactivity (Top Left) - Moved Above Reactor (x=50, w=140). Gauge Width=80/100. */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={40} y={110} label="Reactivity" value={fmt(state.display_reactivity, 1)} unit="pcm" width={90} />

      {/* Core Temp (Top Left) - Moved Above Reactor */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={140} y={110} label="Core Temp" value={fmt(state.display_core_t, 1)} unit="°C" width={90} />

      {/* Turbine Speed (Top Right) */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={700} y={20} label="Turbine Spd" value={fmt(state.turbine_rpm, 0)} unit="rpm" width={100} />

      {/* SG Level (On SG) */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={310} y={230} label="SG Level" value={fmt(state.display_sg_level, 1)} unit="%"
          warn={state.sg_low_level || state.sg_high_level}
          compact={true}
      />

      {/* Primary Flow (Between Reactor and RCP) */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={175} y={310} label="Primary Flow" value={fmt(state.display_pri_flow/1000, 1)} unit="kL/s" width={90} />

      {/* Feedwater Flow (Between SG and FWCV) */}
      {/* MOVED UP to y=400 (was 420) to separate from FWCV at y=500. */}
      {/* NO TOOLTIP */}
      <DigitalGauge x={320} y={400} label="FW Flow" value={fmt(state.display_fw_flow, 0)} unit="L/s"
          warn={state.fw_low_flow} width={80} compact={true}
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
            {/* No Tooltip here as requested */}
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

const Valve = ({ x, y, open, label, vertical = true, scale = 1, labelY, labelOffset, fullName }: any) => {
    const cBody = "#94a3b8"; // Slate 400
    // 5) Valve Color Rules: Open = Green (#22c55e), Closed = Gray (#64748b)
    const cFill = open ? "#22c55e" : "#64748b";

    // Default label pos
    const ly = labelY || -30;
    const lx = labelOffset || 0;

    // Handle is fixed relative to pipe orientation.
    // If pipe is vertical, handle should be horizontal (perpendicular).
    // If pipe is horizontal, handle should be horizontal (perpendicular to stem which is vertical).
    // Wait, the image shows a T-handle.
    // Usually, "perpendicular to pipe" means if pipe is Left-Right, Stem is Up, Handle is Left-Right (parallel to pipe? No, T-handle usually crosses stem).
    // Let's look at the image again: "TBCV" image shows a horizontal pipe, vertical stem, and a HORIZONTAL bar handle on top.
    // So the handle is Parallel to the pipe.
    // If the pipe is VERTICAL (e.g. MSIV), the stem usually sticks out sideways or the valve is drawn rotated 90deg.
    // If we rotate the whole valve 90deg for vertical pipes, the handle also rotates 90deg (becoming vertical).
    // BUT the user said: "Valve handle fixed! Perpendicular to hourglass shape".
    // The hourglass (bowtie) is the body.
    // If pipe is horizontal, bowtie is Left/Right triangles.
    // Perpendicular to bowtie's axis (L-R) would be Vertical? No, the image shows Horizontal handle.
    // Let's re-read: "Valve handle fixed! Perpendicular to hourglass shape" (user text) vs Image (Horizontal handle, Horizontal pipe).
    // Hourglass axis is along the flow.
    // Perpendicular to flow is the Stem direction.
    // The Handle is usually perpendicular to the Stem (forming a T).
    // So Handle is Parallel to Flow.
    // Let's implement T-handle fixed to the stem.
    // Since we rotate the whole group by 90deg for `vertical` prop, the handle will rotate with it.
    // If the user wants the handle to ALWAYS be horizontal regardless of pipe, we need to counter-rotate.
    // BUT "perpendicular to hourglass" means if hourglass is vertical (flow vertical), handle is horizontal?
    // If hourglass is horizontal (flow horizontal), handle is vertical?
    // The image shows Horizontal Pipe, Vertical Stem, Horizontal Handle.
    // User text: "Handle fixed! Perpendicular to hourglass shape".
    // If hourglass is L-R (Horizontal), Perpendicular is Up-Down (Vertical).
    // This contradicts the image.
    // BUT the image might be the "example" of what they want.
    // The image shows a T-handle. T-handle bar is parallel to flow.
    // Maybe they mean the Handle BAR is perpendicular to the STEM.
    // Let's assume the Image is the truth.
    // Image: T-handle. Bar is parallel to pipe.
    // Implication:
    // Horizontal Pipe -> Horizontal Handle Bar.
    // Vertical Pipe -> Vertical Handle Bar (because we rotate everything 90deg).
    // User instruction "Valve handle fixed! Perpendicular to hourglass shape".
    // If "hourglass shape" implies the triangles, the "axis" is the flow. Perpendicular is the Stem.
    // If they mean the handle bar is perpendicular to the STEM, that creates a T.
    // "Fixed" means it doesn't rotate with value.

    return (
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            {fullName && <title>{fullName}</title>}

            {/* Valve Symbol (Bowtie) - Rotates with pipe orientation (vertical prop) */}
            <path d="M -10 -10 L 10 10 L 10 -10 L -10 10 Z" fill={cFill} stroke="black" strokeWidth="1" transform={vertical ? "rotate(90)" : ""} />

            {/* Stem - Fixed relative to body */}
            {/* If Vertical=true (Flow is Up/Down), we usually draw stem to the Right or Left?
                The current code rotates the bowtie 90deg.
                But the Stem is drawn at x=0, y=0 to y=-15.
                So Stem is ALWAYS Up?
                If pipe is vertical, Bowtie is rotated 90deg. It occupies Y space.
                Stem at 0,-15 sticks out 'Up' relative to the group.
                If the group is NOT rotated, Stem is Up. Pipe is Horizontal. Matches Image.
                If Pipe is Vertical, we only rotate the Bowtie path? Yes, looks like `transform={vertical ? "rotate(90)" : ""}` is only on the PATH.
                So Stem is ALWAYS Up.
            */}

            {/* Stem */}
            <line x1="0" y1="0" x2="0" y2="-15" stroke={cBody} strokeWidth="2" />

            {/* T-Handle - Fixed */}
            {/* Drawn as a horizontal bar at top of stem. */}
            {/* Since Stem is always 'Up' (0, -15), the Handle should be a horizontal line at -15. */}
            {/* This matches the image for Horizontal Pipe. */}
            {/* For Vertical Pipe, the Bowtie is rotated. The Stem is still Up. So Handle is still Horizontal.
                This means for a vertical pipe, the stem sticks out 'sideways' (visually Up is sideways to vertical pipe).
                Wait, if pipe is vertical (running Y axis), 'Up' (negative Y) is along the pipe? No, 'Up' is screen coordinates.
                If pipe is vertical (e.g. MSIV), we want the stem to stick out to the side?
                Currently `Valve` is placed at (x,y).
                If Vertical=true, we expect flow in Y.
                The stem drawn at (0,0) to (0,-15) goes Up.
                Ideally for vertical pipe, stem sticks Left or Right.
                BUT existing code didn't rotate the stem. It only rotated the Bowtie.
                So Stem was always pointing Up.
                The Handle bar (x1=-8, x2=8) is Horizontal.
                So T-Handle is formed.
                It stays fixed.
                This satisfies "Handle fixed".
                It satisfies "Perpendicular to hourglass" if hourglass is vertical, handle is horizontal.
            */}

            {/* Handle Bar (Rounded Rect or Thick Line) */}
            {/* Image shows a rounded rectangle. */}
            <rect x="-10" y="-19" width="20" height="4" rx="2" fill={cBody} stroke="none" />

            {/* Label */}
            {label && (
                <text x={lx} y={ly} textAnchor="middle" fontSize="12" fill="#cbd5e1" fontWeight="normal">{label}</text>
            )}
        </g>
    );
};
