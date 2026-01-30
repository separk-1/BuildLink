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
  class_num?: string; // Key for grouping related edges
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

  const { activeStepId, setActiveStepId, stepHistory, goToPreviousStep } = useSimulationStore();
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
      label: r.edge_name,
      class_num: r.class_num // Capture grouping key
    })).filter((l: any) => {
      // Filter dangling links
      return nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target);
    });

    setGraphData({ nodes, links });
  }, [entityCsv, relationshipCsv, loading]);

  // Determine Highlighting Set (Memoized)
  const highlightSet = useMemo(() => {
      const set = new Set<string>();
      if (!activeStepId) return set;

      set.add(activeStepId);
      // Removed edge and neighbor highlighting logic as per user request.
      // "Only the current active step node should be highlighted. Edges and subsequent steps should remain in the default style."

      return set;
  }, [activeStepId]);


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
      const genericLink = links.find(l => !['verify', 'true_then', 'false_then', 'if'].includes(l.label));

      // 1. Decision (Check-If)
      if (trueLink || falseLink) {
          const getTarget = (l?: CustomLink) => typeof l?.target === 'object' ? (l.target as CustomNode).id : l?.target as string;
          return {
              type: 'DECISION',
              trueNode: getTarget(trueLink),
              falseNode: getTarget(falseLink),
              ifLink
          };
      }

      // 2. Verify
      if (verifyLink) {
           const getTarget = (l?: CustomLink) => typeof l?.target === 'object' ? (l.target as CustomNode).id : l?.target as string;
           return {
               type: 'VERIFY',
               nextNode: getTarget(nextLink), // Proceed to next step after verification
               verifyLink
           };
      }

      // 3. Standard Next
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

  // Auto Focus Logic (Zoom to Highlighted Chain)
  useEffect(() => {
    if (!autoFocus || !activeStepId || !fgRef.current || highlightSet.size === 0) return;

    // Filter nodes that are in the highlight set
    const relevantNodes = graphData.nodes.filter(n => highlightSet.has(n.id));

    if (relevantNodes.length === 0) return;

    // Small delay to allow graph to settle
    const timer = setTimeout(() => {
        // Calculate bounding box or just use zoomToFit with filter
        // ForceGraph2D's zoomToFit doesn't accept a filter directly, sadly.
        // It fits *all* nodes.
        // So we must use 'zoomToFit' with a coordinate calculation?
        // Actually, many versions of force-graph allow passing (padding, duration, node => boolean).
        // Let's check typical API. Standard API is zoomToFit(duration, padding, nodeFilter).
        // If nodeFilter is supported:
        fgRef.current.zoomToFit(1000, 100, (node: CustomNode) => highlightSet.has(node.id));
    }, 200);

    return () => clearTimeout(timer);
  }, [activeStepId, autoFocus, highlightSet, graphData]);


  const paintNode = useCallback((node: CustomNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isActive = node.id === activeStepId;
    const isHighlighted = highlightSet.has(node.id);
    const label = node.name;
    const fontSize = 12 / globalScale;

    // Opacity Logic
    const opacity = isHighlighted ? 1 : 0.2;
    ctx.globalAlpha = opacity;

    // 1. Draw Node
    if (isActive) {
      // Glow
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 12, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else {
        // Standard or Highlighted Target
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = getNodeColor(node.type);
        ctx.fill();
    }

    // 2. Draw Label
    // Show label if Active OR Highlighted (Zoomed in) OR High Zoom
    if (isHighlighted || globalScale > 1.2) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#fff' : `rgba(255, 255, 255, ${opacity})`;
      ctx.fillText(label, node.x!, node.y! + 8 + fontSize);
    }

    // Reset Opacity
    ctx.globalAlpha = 1;

  }, [activeStepId, highlightSet]);

  const paintLink = useCallback((link: CustomLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source as CustomNode;
      const end = link.target as CustomNode;
      if (typeof start !== 'object' || typeof end !== 'object') return;

      const sourceId = start.id;
      const targetId = end.id;

      // Check if this link is part of the "Active Chain"
      // It is part of the chain if BOTH source and target are in highlightSet
      // AND (it's a direct link from activeStep OR it shares the class_num of a direct link)

      // Simple approximation: If both nodes are in highlightSet, highlight the link?
      // No, that might highlight cross-links between highlighted nodes that aren't relevant.
      // But for tree-like procedures, it's probably fine.
      // Better: Check if one of them is the Active Step, OR if they share a class_num with the active step's outgoing link.

      // Check class_num relevance
      // We need to know the class_num of the *active outgoing link*
      // This is expensive to calculate inside paintLink every frame.
      // Optimization: We rely on highlightSet containing only the relevant nodes.
      // If both source and target are in highlightSet, we assume the link is relevant.
      const isRelevant = highlightSet.has(sourceId) && highlightSet.has(targetId);

      let strokeStyle = '#475569';
      let lineWidth = 1 / globalScale;
      let opacity = 0.3; // Default visible (was 0.1)

      if (isRelevant) {
          opacity = 1;
          strokeStyle = '#eab308'; // Unify all active highlights to Yellow
          lineWidth = 2 / globalScale;
      }

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.moveTo(start.x!, start.y!);
      ctx.lineTo(end.x!, end.y!);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Label
      if (link.label) {
          const midX = (start.x! + end.x!) / 2;
          const midY = (start.y! + end.y!) / 2;
          // Scale labels with zoom: fixed size in graph units (e.g., 4)
          // As globalScale increases (zoom in), the screen size (4 * globalScale) increases.
          const fontSize = 4;

          if (globalScale > 0.2) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isRelevant ? '#fff' : 'rgba(100, 116, 139, 0.5)';
              ctx.fillText(link.label, midX, midY);
          }
      }
      ctx.globalAlpha = 1;

  }, [activeStepId, highlightSet]);

  return (
    <>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>PROCEDURES / KG</span>
            {activeStepId && (
                 <span style={{
                     fontSize: '0.7rem',
                     background: 'rgba(255, 255, 255, 0.1)',
                     padding: '2px 6px',
                     borderRadius: '4px',
                     border: '1px solid rgba(255, 255, 255, 0.2)',
                     color: '#eab308'
                 }}>
                     STEP: {activeStepId}
                 </span>
            )}
        </div>
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
          // Physics Configuration
          d3VelocityDecay={0.2}
          cooldownTicks={100}
          onEngineStop={() => {
              // Initial focus
              if (autoFocus && activeStepId && highlightSet.size > 0 && fgRef.current) {
                 fgRef.current.zoomToFit(1000, 100, (n: CustomNode) => highlightSet.has(n.id));
              }
          }}
          // Customize Links
          linkColor={() => '#475569'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={2}
          onNodeDragEnd={node => {
            setAutoFocus(false);
            if (node.x && node.y) {
                node.fx = node.x;
                node.fy = node.y;
            }
          }}
        />

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: 60, left: 10, background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4, pointerEvents: 'none', zIndex: 10 }}>
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
            justifyContent: 'space-between', // Changed to space-between for Back button
            gap: '10px',
            zIndex: 20
        }}>
           {/* Back Button */}
           <div>
               {stepHistory.length > 0 && (
                   <button className="dcs-btn" onClick={goToPreviousStep} style={{ borderColor: '#64748b', color: '#94a3b8' }}>
                       PREVIOUS STEP
                   </button>
               )}
           </div>

           <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginRight: 10 }}>
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
