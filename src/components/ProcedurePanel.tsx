import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D, { type NodeObject, type LinkObject } from 'react-force-graph-2d';
import { useSimulationStore } from '../store/simulationStore';
import { useGraphData } from '../hooks/useGraphData';

// Extend NodeObject to include our custom properties
interface CustomNode extends NodeObject {
  id: string;
  name: string;
  type: string;
  value?: string;
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

export const ProcedurePanel = () => {
  const fgRef = useRef<any>(undefined);
  const [graphData, setGraphData] = useState<{ nodes: CustomNode[], links: CustomLink[] }>({ nodes: [], links: [] });
  const [autoFocus, setAutoFocus] = useState(true);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { activeStepId, setActiveStepId } = useSimulationStore();
  const { entityCsv, relationshipCsv, loading } = useGraphData();

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
      value: e.entity_value,
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

  // Analyze Current Step Options (Memoized)
  const stepOptions = useMemo(() => {
      if (!activeStepId || graphData.links.length === 0) return { type: 'NONE' };

      // Find all outgoing links from activeStepId
      // Note: react-force-graph converts source to object, so we check ID safely
      const links = graphData.links.filter(l => {
          const sId = typeof l.source === 'object' ? (l.source as CustomNode).id : l.source;
          return sId === activeStepId;
      });

      const verifyLink = links.find(l => l.label === 'verify');
      const trueLink = links.find(l => l.label === 'true_then');
      const falseLink = links.find(l => l.label === 'false_then');
      const ifLink = links.find(l => l.label === 'if');
      const nextLink = links.find(l => l.label === 'next' || l.label.startsWith('follow_next'));

      // Also check for generic edges if no specific ones found (fallback for linear flow)
      const genericLink = links.find(l => !['verify', 'true_then', 'false_then', 'if'].includes(l.label));

      // 1. Decision (Check-If)
      if (trueLink || falseLink) {
          // Helper to get target ID safely
          const getTarget = (l?: CustomLink) => typeof l?.target === 'object' ? (l.target as CustomNode).id : l?.target as string;
          return {
              type: 'DECISION',
              trueNode: getTarget(trueLink),
              falseNode: getTarget(falseLink),
              ifLink
          };
      }

      // 2. Logic Node Decision (Sometimes 'if' leads to logic node which splits)
      // Actually, in the CSV we saw: Step -> if -> LogicNode -> [Check -> Component]
      // And Step -> true_then -> LogicNode
      // So if we are at Step, we see true_then/false_then.
      // My logic above handles that.

      // 3. Verify
      if (verifyLink) {
           const getTarget = (l?: CustomLink) => typeof l?.target === 'object' ? (l.target as CustomNode).id : l?.target as string;
           // Usually verify steps also have a 'next' link to the subsequent step
           // Or the user confirms and we just move to the 'next' link target
           return {
               type: 'VERIFY',
               nextNode: getTarget(nextLink), // Proceed to next step after verification
               verifyLink
           };
      }

      // 4. Standard Next
      if (nextLink || genericLink) {
          const link = nextLink || genericLink;
          const getTarget = (l?: CustomLink) => typeof l?.target === 'object' ? (l.target as CustomNode).id : l?.target as string;
          return {
              type: 'STEP',
              nextNode: getTarget(link)
          };
      }

      return { type: 'END' };

  }, [activeStepId, graphData]);

  // Auto Focus Logic
  useEffect(() => {
    if (!autoFocus || !activeStepId || !fgRef.current) return;

    // Small delay to allow graph to settle/render before focusing
    const timer = setTimeout(() => {
      const node = graphData.nodes.find(n => n.id === activeStepId);
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(2.5, 1000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeStepId, autoFocus, graphData]);


  const paintNode = useCallback((node: CustomNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isActive = node.id === activeStepId;
    const label = node.name;
    const fontSize = 12 / globalScale;

    // 1. Draw "Glow" for active node
    if (isActive) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 12, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Blue Glow
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#fff';
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
  }, [activeStepId]);

  const paintLink = useCallback((link: CustomLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // 1. Draw Line
      const start = link.source as CustomNode;
      const end = link.target as CustomNode;

      if (typeof start !== 'object' || typeof end !== 'object') return;

      const sourceId = start.id;
      const isOutgoing = sourceId === activeStepId;

      let strokeStyle = '#475569';
      let lineWidth = 1 / globalScale;

      // Highlight Logic
      if (isOutgoing) {
          if (['verify', 'if'].includes(link.label)) {
              strokeStyle = '#eab308'; // Yellow for Logic/Verify action
              lineWidth = 2 / globalScale;
          } else if (['true_then', 'false_then'].includes(link.label)) {
              strokeStyle = '#eab308'; // Highlight branch paths too
              lineWidth = 2 / globalScale;
          } else if (link.label === 'next' || link.label.startsWith('follow')) {
               strokeStyle = '#3b82f6'; // Blue for standard path
          }
      } else {
          // Passive links
           if (link.label === 'next') strokeStyle = '#334155';
      }

      ctx.beginPath();
      ctx.moveTo(start.x!, start.y!);
      ctx.lineTo(end.x!, end.y!);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Draw Label
      if (link.label) {
          const midX = (start.x! + end.x!) / 2;
          const midY = (start.y! + end.y!) / 2;
          const fontSize = 10 / globalScale; // Scaled font size

          // Optional: Only show if zoomed in
          if (globalScale > 0.5) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isOutgoing ? '#fff' : '#64748b'; // Highlight label if active
              ctx.fillText(link.label, midX, midY);
          }
      }
  }, [activeStepId]);

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
          linkCanvasObject={paintLink}
          linkCanvasObjectMode={() => 'replace'}
          nodeLabel={(node: CustomNode) => {
              if (node.value && node.value.toLowerCase() !== 'na') {
                  return node.value;
              }
              return node.name;
          }}
          // Physics Configuration to reduce clutter
          d3VelocityDecay={0.2}
          cooldownTicks={100}
          onEngineStop={() => {
              // Initial center if needed
              if (autoFocus && activeStepId) {
                 const node = graphData.nodes.find(n => n.id === activeStepId);
                 if (node && fgRef.current) {
                     fgRef.current.centerAt(node.x, node.y, 1000);
                     fgRef.current.zoom(2.5, 1000);
                 }
              }
          }}
          // Customize Links
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

        {/* Procedure Control Footer */}
        <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            background: 'rgba(15, 23, 42, 0.9)',
            borderTop: '1px solid #334155',
            padding: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            zIndex: 20
        }}>
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', paddingLeft: 10 }}>
                {stepOptions.type === 'VERIFY' && "Wait for Verify..."}
                {stepOptions.type === 'DECISION' && "Wait for Decision..."}
                {stepOptions.type === 'STEP' && "Proceed..."}
                {stepOptions.type === 'END' && "Procedure End"}
           </div>

           {stepOptions.type === 'VERIFY' && (
               <button className="dcs-btn" style={{ borderColor: '#eab308', color: '#eab308' }} onClick={() => stepOptions.nextNode && setActiveStepId(stepOptions.nextNode)}>
                   CONFIRM CHECK
               </button>
           )}

           {stepOptions.type === 'DECISION' && (
               <>
                   <button className="dcs-btn" style={{ borderColor: '#22c55e', color: '#22c55e' }} onClick={() => stepOptions.trueNode && setActiveStepId(stepOptions.trueNode)}>
                       YES (TRUE)
                   </button>
                   <button className="dcs-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => stepOptions.falseNode && setActiveStepId(stepOptions.falseNode)}>
                       NO (FALSE)
                   </button>
               </>
           )}

           {stepOptions.type === 'STEP' && (
                <button className="dcs-btn" onClick={() => stepOptions.nextNode && setActiveStepId(stepOptions.nextNode)}>
                    NEXT STEP
                </button>
           )}

            {stepOptions.type === 'NONE' && (
                <button className="dcs-btn" onClick={() => setActiveStepId('pc_st_01_01')}>
                    START PROCEDURE
                </button>
            )}
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
