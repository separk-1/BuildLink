import { useEffect, useRef, useState } from 'react';
import { ENTITY_CSV, RELATIONSHIP_CSV } from '../data/graphData';

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
    // Handle quotes if needed, but for this data simple split works
    const values = line.split(',');
    // Handle commas inside quotes logic is complex, assuming simple data for now
    // Actually the data has "e.g. if, and" in notes but the IDs don't have commas.
    // The description field might have commas.
    // Let's regex split properly if needed, but the provided CSV structure looks safe for simple split.
    const row: any = {};
    headers.forEach((h, i) => row[h.trim()] = values[i]?.trim());
    return row;
  });
};

export const ProcedurePanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

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
        // Filter out links where nodes are missing
        const s = newNodes.find(n => n.id === l.source);
        const t = newNodes.find(n => n.id === l.target);
        return s && t;
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, []);

  // Force Simulation Loop
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

      // 1. Calculate Forces
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy || 1;
          const force = 5000 / distSq; // Repulsion strength
          const fx = (dx / Math.sqrt(distSq)) * force;
          const fy = (dy / Math.sqrt(distSq)) * force;

          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction (Springs)
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.05; // Spring strength, rest length 100
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Center Gravity
      nodes.forEach(node => {
        node.vx += (width / 2 - node.x) * 0.01;
        node.vy += (height / 2 - node.y) * 0.01;

        // Damping
        node.vx *= 0.9;
        node.vy *= 0.9;

        // Position Update
        node.x += node.vx;
        node.y += node.vy;
      });

      // 2. Render
      ctx.clearRect(0, 0, width, height);

      // Draw Links
      ctx.strokeStyle = '#64748b'; // slate-500
      ctx.lineWidth = 1;
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Draw Label (optional, might clutter)
          // ctx.fillStyle = '#94a3b8';
          // ctx.fillText(link.label, (source.x + target.x)/2, (source.y + target.y)/2);
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);

        // Color by Type
        if (node.type === 'PC_ST') ctx.fillStyle = '#3b82f6'; // Blue
        else if (node.type === 'PC_LO') ctx.fillStyle = '#eab308'; // Yellow
        else if (node.type === 'CT') ctx.fillStyle = '#22c55e'; // Green
        else if (node.type === 'IC') ctx.fillStyle = '#06b6d4'; // Cyan
        else ctx.fillStyle = '#94a3b8'; // Gray (PC_FT)

        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '10px Arial';
        ctx.fillText(node.name.substring(0, 15), node.x + 10, node.y + 3);
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links]);

  return (
    <>
      <div className="panel-title">
        <span>PROCEDURES / KG</span>
        <span style={{ fontSize: '0.6rem' }}>{nodes.length} Nodes</span>
      </div>
      <div className="panel-content" style={{ padding: 0, overflow: 'hidden' }}>
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ width: '100%', height: '100%', background: '#0f172a' }}
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
