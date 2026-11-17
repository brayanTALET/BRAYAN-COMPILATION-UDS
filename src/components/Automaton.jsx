const R = 20, DX = 110, DY = 85, PAD = 50;

function normalize(auto, prefix) {
  const name = (q) => (typeof q === 'number' ? `${prefix}${q}` : q);
  const ids = typeof auto.states === 'number' ? Array.from({ length: auto.states }, (_, i) => i) : auto.states;
  return {
    states: ids.map(name),
    start: name(auto.start),
    finals: (auto.finals ?? auto.accepts).map(name),
    transitions: auto.transitions.map((t) => ({ from: name(t.from), to: name(t.to), label: t.label })),
  };
}

function layout(auto) {
  const depth = new Map([[auto.start, 0]]);
  const queue = [auto.start];
  while (queue.length) {
    const q = queue.shift();
    for (const t of auto.transitions) {
      if (t.from === q && !depth.has(t.to)) { depth.set(t.to, depth.get(q) + 1); queue.push(t.to); }
    }
  }
  const rows = {};
  const pos = new Map();
  for (const q of auto.states) {
    const d = depth.get(q) ?? 0;
    rows[d] = (rows[d] ?? -1) + 1;
    pos.set(q, { x: PAD + d * DX, y: PAD + rows[d] * DY });
  }
  const w = PAD * 2 + Math.max(...[...pos.values()].map((p) => p.x)) - PAD;
  const h = PAD * 2 + Math.max(...[...pos.values()].map((p) => p.y)) - PAD;
  return { pos, w: w + 10, h: h + 30 };
}

function groupEdges(transitions) {
  const map = new Map();
  for (const t of transitions) {
    const k = `${t.from}>${t.to}`;
    if (!map.has(k)) map.set(k, { from: t.from, to: t.to, labels: [] });
    const lab = t.label;
    const e = map.get(k);
    if (!e.labels.includes(lab)) e.labels.push(lab);
  }
  return [...map.values()];
}

export default function Automaton({ auto: raw, prefix = 'q', markerId, title }) {
  const auto = normalize(raw, prefix);
  const { pos, w, h } = layout(auto);
  const edges = groupEdges(auto.transitions);
  const id = `arrow-${markerId}`;

  return (
    <div className="graph" role="img" aria-label={title}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
          </marker>
        </defs>

        {edges.map((e) => {
          const a = pos.get(e.from), b = pos.get(e.to);
          const label = e.labels.join(', ');
          if (e.from === e.to) {
            return (
              <g key={`${e.from}-${e.to}`}>
                <path d={`M${a.x - 11},${a.y - 17} C${a.x - 32},${a.y - 62} ${a.x + 32},${a.y - 62} ${a.x + 11},${a.y - 17}`} className="edge" markerEnd={`url(#${id})`} />
                <text x={a.x} y={a.y - 56} className="elabel" textAnchor="middle">{label}</text>
              </g>
            );
          }
          const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
          const back = b.x <= a.x;
          const off = back ? 46 : 0;
          const hasReverse = edges.some((o) => o.from === e.to && o.to === e.from);
          const bend = off || (hasReverse ? 26 : 0);
          const cx = (a.x + b.x) / 2 + (-dy / L) * bend * 2;
          const cy = (a.y + b.y) / 2 + (dx / L) * bend * 2;
          const trim = (p, q) => { const l = Math.hypot(q.x - p.x, q.y - p.y) || 1; return { x: p.x + ((q.x - p.x) / l) * R, y: p.y + ((q.y - p.y) / l) * R }; };
          const p0 = trim(a, { x: cx, y: cy }), p1 = trim(b, { x: cx, y: cy });
          const mx = 0.25 * p0.x + 0.5 * cx + 0.25 * p1.x, my = 0.25 * p0.y + 0.5 * cy + 0.25 * p1.y;
          const nx = bend ? (-dy / L) * Math.sign(bend) * 9 : 0, ny = bend ? (dx / L) * Math.sign(bend) * 9 : -9;
          return (
            <g key={`${e.from}-${e.to}`}>
              <path d={`M${p0.x},${p0.y} Q${cx},${cy} ${p1.x},${p1.y}`} className="edge" markerEnd={`url(#${id})`} />
              <text x={mx + nx} y={my + ny + 4} className="elabel" textAnchor="middle">{label}</text>
            </g>
          );
        })}

        {auto.states.map((q) => {
          const p = pos.get(q);
          const final = auto.finals.includes(q);
          return (
            <g key={q}>
              <circle cx={p.x} cy={p.y} r={R} className={q === auto.start ? 'node start' : 'node'} />
              {final && <circle cx={p.x} cy={p.y} r={R - 5} className="node-inner" />}
              <text x={p.x} y={p.y + 5} textAnchor="middle" className="nlabel">{q}</text>
            </g>
          );
        })}

        {(() => {
          const p = pos.get(auto.start);
          return <path d={`M${p.x - R - 30},${p.y} L${p.x - R - 1},${p.y}`} className="edge" markerEnd={`url(#${id})`} />;
        })()}
      </svg>
    </div>
  );
}
