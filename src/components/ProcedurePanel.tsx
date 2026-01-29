import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D, { type NodeObject, type LinkObject } from 'react-force-graph-2d';
import { useSimulationStore } from '../store/simulationStore';
import { useGraphData } from '../hooks/useGraphData';

// Extend NodeObject to include our custom properties
interface CustomNode extends NodeObject {
  id: string;
  name: string;
  type: string;
  val?: number; // for particle size logic if needed
}

// Extend LinkObject for our custom properties
interface CustomLink extends LinkObject {
  source: string | CustomNode;
  target: string | CustomNode;
  label: string;
}

// Simple CSV Parser
const parseCSV = (csv: string) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((h, i) => row[h.trim()] = values[i]?.trim());
    return row;
  });
};

// Map simulation state to active Procedure Node ID
const getCurrentStepNodeId = (state: any): string | null => {
    // 1. Initial State -> Step 1
    if (state.fw_flow > 1000 && !state.fw_low_flow) return 'pc_st_01_01'; // STEP1 (Monitoring)

    // 2. Low Flow Alarm -> Step 2
    if (state.fw_low_flow && state.fwcv_mode) return 'pc_st_02_01'; // STEP2 (Check Auto)

    // 3. Manual Mode Taken -> Step 3
    if (!state.fwcv_mode && state.fw_pump) return 'pc_st_03_01'; // STEP3 (Pump Check)

    // 4. Trip Conditions -> Step 4 (Rapid Shutdown)
    // Substeps for Trip
    if (state.trip_turbine && state.turbine_speed_cv === 0) return 'pc_st_05_02'; // Turbine Trip Verify
    if (state.trip_reactor && state.all_rods_down) return 'pc_st_06_02'; // Reactor Trip Verify

    if (state.trip_reactor || state.trip_turbine) return 'pc_st_04_01'; // STEP4

    return null;
};

// Color mapping based on node type
const getNodeColor = (type: string) => {
  switch (type) {
    case 'PC_ST': return '#3b82f6'; // Blue (Step)
    case 'PC_LO': return '#eab308'; // Yellow (Logic)
    case 'CT': return '#22c55e';    // Green (Controller)
    case 'IC': return '#06b6d4';    // Cyan (Indicator)
    default: return '#94a3b8';      // Slate (Feature/Other)
  }
};

const NAME_MAPPING: Record<string, string> = {
    'Feedwater Flow': 'fw_flow',
    'FW Flow': 'fw_flow',
    'Steam Pressure': 'steam_press',
    'Stm Press': 'steam_press',
    'SG Level': 'sg_level',
    'Reactivity': 'reactivity',
    'Core Temp': 'core_t',
    'Primary Flow': 'pri_flow',
    'Turbine Speed': 'turbine_rpm',
    'FW Low Flow': 'fw_low_flow',
    'SG High Level': 'sg_high_level',
    'SG Low Level': 'sg_low_level',
    'Reactor Trip': 'trip_reactor',
    'Turbine Trip': 'trip_turbine'
};

// Helper to try and find a value in simulation state that matches the node
const getNodeValue = (node: CustomNode, state: any): string | number | null => {
    // 1. Try exact ID match
    if (state[node.id] !== undefined) return state[node.id];

    // 2. Try ID as key (normalize) - e.g. "FW Flow" -> "fw_flow"
    const normalizedId = node.id.toLowerCase().replace(/ /g, '_');
    if (state[normalizedId] !== undefined) return state[normalizedId];

    // 3. Try Name as key
    if (node.name) {
        const normalizedName = node.name.toLowerCase().replace(/ /g, '_');
        if (state[normalizedName] !== undefined) return state[normalizedName];

        // 4. Try display_ prefix
        const displayKey = `display_${normalizedName}`;
        if (state[displayKey] !== undefined) return state[displayKey];

        // 5. Try explicit mapping
        if (NAME_MAPPING[node.name]) {
             const key = NAME_MAPPING[node.name];
             if (state[key] !== undefined) return state[key];
             if (state[`display_${key}`] !== undefined) return state[`display_${key}`];
        }
    }

    return null;
};

export const ProcedurePanel = () => {
  const fgRef = useRef<any>(undefined);
  const [graphData, setGraphData] = useState<{ nodes: CustomNode[], links: CustomLink[] }>({ nodes: [], links: [] });
  const [autoFocus, setAutoFocus] = useState(true);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const simState = useSimulationStore();
  const { entityCsv, relationshipCsv, loading } = useGraphData();
  const activeNodeId = getCurrentStepNodeId(simState);

  // Resize Observer to handle panel resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Parse Data when available
  useEffect(() => {
    if (loading || !entityCsv || !relationshipCsv) return;

    const entities = parseCSV(entityCsv);
    const relationships = parseCSV(relationshipCsv);

    const nodes: CustomNode[] = entities.map((e: any) => ({
      id: e.entity_id,
      name: e.entity_name,
      type: e.entity_type,
      val: 1
    }));

    const links: CustomLink[] = relationships.map((r: any) => ({
      source: r.src_id,
      target: r.dst_id,
      label: r.edge_name
    })).filter((l: any) => {
      // Filter dangling links
      return nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target);
    });

    setGraphData({ nodes, links });
  }, [entityCsv, relationshipCsv, loading]);

  // Auto Focus Logic
  useEffect(() => {
    if (!autoFocus || !activeNodeId || !fgRef.current) return;

    // Small delay to allow graph to settle/render before focusing
    const timer = setTimeout(() => {
      const node = graphData.nodes.find(n => n.id === activeNodeId);
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(2.5, 1000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeNodeId, autoFocus, graphData]);


  const paintNode = useCallback((node: CustomNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isActive = node.id === activeNodeId;
    const label = node.name;
    const fontSize = 12 / globalScale;

    // 1. Draw "Glow" for active node
    if (isActive) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 12, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    } else {
        // Standard node circle
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = getNodeColor(node.type);
        ctx.fill();
    }

    // 2. Draw Label (LOD Logic)
    // Always show label for Active node
    // For others, only show if zoomed in (globalScale > 1.5)
    if (isActive || globalScale > 1.2) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)';
      // Offset text below node
      ctx.fillText(label, node.x!, node.y! + 8 + fontSize);
    }
  }, [activeNodeId]);

  return (
    <>
      <div className="panel-title">
        <span>PROCEDURES / KG</span>
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                className="dcs-btn"
                onClick={() => setAutoFocus(!autoFocus)}
                style={{ padding: '2px 8px', fontSize: '0.6rem', background: autoFocus ? 'var(--color-info)' : 'transparent' }}
            >
                AUTO-FOCUS: {autoFocus ? 'ON' : 'OFF'}
            </button>
            <span style={{ fontSize: '0.6rem' }}>{graphData.nodes.length} Nodes</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="panel-content"
        style={{ padding: 0, overflow: 'hidden', position: 'relative', background: '#0f172a' }}
      >
        <ForceGraph2D
          ref={fgRef}
          width={containerDimensions.width}
          height={containerDimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodeLabel={(node: any) => {
              const val = getNodeValue(node, simState);
              if (val !== null && val !== undefined) {
                  // Format number if it is a number
                  const displayVal = typeof val === 'number' ? val.toFixed(2) : val;
                  return `${node.name}\nValue: ${displayVal}`;
              }
              return node.name;
          }}
          // Physics Configuration to reduce clutter
          d3VelocityDecay={0.2}
          cooldownTicks={100}
          onEngineStop={() => {
              // Initial center if needed
              if (autoFocus && activeNodeId) {
                 const node = graphData.nodes.find(n => n.id === activeNodeId);
                 if (node && fgRef.current) {
                     fgRef.current.centerAt(node.x, node.y, 1000);
                     fgRef.current.zoom(2.5, 1000);
                 }
              } else if (fgRef.current) {
                  fgRef.current.zoomToFit(400);
              }
          }}
          // Customize Links
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
             const label = link.label;
             if (!label) return;

             const fontSize = 10 / globalScale;
             ctx.font = `${fontSize}px Sans-Serif`;
             const textWidth = ctx.measureText(label).width;
             const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

             const start = link.source;
             const end = link.target;
             // ignore unbound links
             if (typeof start !== 'object' || typeof end !== 'object') return;

             const x = (start.x + end.x) / 2;
             const y = (start.y + end.y) / 2;

             ctx.save();
             ctx.translate(x, y);

             // Rotate label to align with link
             const angle = Math.atan2(end.y - start.y, end.x - start.x);
             // Keep text upright
             if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                 ctx.rotate(angle + Math.PI);
             } else {
                 ctx.rotate(angle);
             }

             // Background
             ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
             ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

             // Text
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillStyle = '#94a3b8';
             ctx.fillText(label, 0, 0);

             ctx.restore();
          }}
          linkColor={() => '#475569'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={2}
          onNodeDragEnd={node => {
            setAutoFocus(false); // Disable auto-focus if user manually moves things
            if (node.x && node.y) {
                node.fx = node.x; // Fix position after drag
                node.fy = node.y;
            }
          }}
        />

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4, pointerEvents: 'none', zIndex: 10 }}>
            <LegendItem color="#3b82f6" label="Step" />
            <LegendItem color="#eab308" label="Logic" />
            <LegendItem color="#22c55e" label="Controller" />
            <LegendItem color="#06b6d4" label="Indicator" />
            <LegendItem color="#94a3b8" label="Feature" />
        </div>
      </div>
    </>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#cbd5e1' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
        {label}
    </div>
);
