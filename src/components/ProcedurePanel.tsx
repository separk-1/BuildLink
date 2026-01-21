import { useEffect, useRef, useState } from 'react';
import { ENTITY_CSV, RELATIONSHIP_CSV } from '../data/graphData';
import { useSimulationStore } from '../store/simulationStore';

interface Node {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
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
    // Simple heuristic mapping based on LOFW progression

    // 1. Initial State -> Step 1
    if (state.fw_flow > 1000 && !state.fw_low_flow) return 'pc_st_100_000000'; // STEP1 (Monitoring)

    // 2. Low Flow Alarm -> Step 2
    if (state.fw_low_flow && state.fwcv_mode) return 'pc_st_200_000000'; // STEP2 (Check Auto)

    // 3. Manual Mode Taken -> Step 3
    if (!state.fwcv_mode && state.fw_pump) return 'pc_st_300_000000'; // STEP3 (Pump Check)

    // 4. Trip Conditions -> Step 4 (Rapid Shutdown)
    if (state.trip_reactor || state.trip_turbine) return 'pc_st_400_000000'; // STEP4

    // Substeps for Trip
    if (state.trip_turbine && state.turbine_speed_cv === 0) return 'pc_st_420_000000'; // Turbine Trip Verify
    if (state.trip_reactor && state.all_rods_down) return 'pc_st_430_000000'; // Reactor Trip Verify

    return null;
};

export const ProcedurePanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  // Transform State for Zoom/Pan
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [autoFocus, setAutoFocus] = useState(true);

  const simState = useSimulationStore();

  // Parse Data on Mount
  useEffect(() => {
    const entities = parseCSV(ENTITY_CSV);
    const relationships = parseCSV(RELATIONSHIP_CSV);

    const newNodes: Node[] = entities.map((e: any) => ({
      id: e.entity_id,
      name: e.entity_name,
      type: e.entity_type,
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0
    }));

    const newLinks: Link[] = relationships.map((r: any) => ({
      source: r.src_id,
      target: r.dst_id,
      label: r.edge_name
    })).filter((l: Link) => {
        const s = newNodes.find(n => n.id === l.source);
        const t = newNodes.find(n => n.id === l.target);
        return s && t;
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, []);

  // Auto Focus Logic
  useEffect(() => {
    if (!autoFocus) return;
    const targetId = getCurrentStepNodeId(simState);
    if (!targetId) return;

    const targetNode = nodes.find(n => n.id === targetId);
    if (targetNode && canvasRef.current) {
        // Smoothly pan to center this node
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        // Target translation to put node at center:
        // center_x = node_x * k + tx
        // tx = center_x - node_x * k
        const targetTx = (w / 2) - targetNode.x * transform.k;
        const targetTy = (h / 2) - targetNode.y * transform.k;

        // Lerp
        setTransform(prev => ({
            k: prev.k,
            x: prev.x + (targetTx - prev.x) * 0.05,
            y: prev.y + (targetTy - prev.y) * 0.05
        }));
    }
  }, [simState, nodes, autoFocus, transform.k]); // transform.x/y removed from dependency to avoid loop, but we need re-render

  // Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, transform.k * (1 + scaleAmount)), 5);
    setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    setAutoFocus(false); // User wants control
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Force Simulation & Render Loop
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Calculate Forces (Simulation runs in "World Space")
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy || 1;
          const force = 5000 / distSq;
          const fx = (dx / Math.sqrt(distSq)) * force;
          const fy = (dy / Math.sqrt(distSq)) * force;

          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.05;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Center Gravity (To World Origin 400,300 approx)
      nodes.forEach(node => {
        node.vx += (400 - node.x) * 0.01;
        node.vy += (300 - node.y) * 0.01;
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
      });

      // 2. Render
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Zoom/Pan
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Draw Links
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1 / transform.k; // Keep lines thin visually
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw Nodes
      const activeNodeId = getCurrentStepNodeId(simState);

      nodes.forEach(node => {
        const isActive = node.id === activeNodeId;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2); // Radius 8 fixed in world space

        if (isActive) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fff'; // Highlight active
        } else {
            ctx.shadowBlur = 0;
            if (node.type === 'PC_ST') ctx.fillStyle = '#3b82f6';
            else if (node.type === 'PC_LO') ctx.fillStyle = '#eab308';
            else if (node.type === 'CT') ctx.fillStyle = '#22c55e';
            else if (node.type === 'IC') ctx.fillStyle = '#06b6d4';
            else ctx.fillStyle = '#94a3b8';
        }

        ctx.fill();
        ctx.strokeStyle = isActive ? '#fff' : '#000';
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset

        // Label
        ctx.fillStyle = '#f1f5f9';
        // Scale font so it stays readable but zooms with world?
        // Or keep fixed size? Fixed size is better for readability usually,
        // but simple canvas text transforms with context.
        // Let's let it scale for now.
        ctx.font = '10px Arial';
        ctx.fillText(node.name.substring(0, 15), node.x + 10, node.y + 3);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links, transform, simState]);

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
            <span style={{ fontSize: '0.6rem' }}>{nodes.length} Nodes</span>
        </div>
      </div>
      <div className="panel-content" style={{ padding: 0, overflow: 'hidden' }}>
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%', background: '#0f172a', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4, pointerEvents: 'none' }}>
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
