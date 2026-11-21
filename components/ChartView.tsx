import type { ChartData } from "@/content/types";

const SERIES_COLORS = ["var(--listening)", "var(--brand)", "var(--reading)", "var(--writing)"];

/** Renders an IELTS Writing Task 1 chart (bar or line) from data. */
export function ChartView({ chart }: { chart: ChartData }) {
  if (chart.kind === "table") {
    return (
      <figure className="overflow-x-auto rounded-[10px] border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <caption className="mb-3 text-center font-bold">{chart.title}</caption>
          <thead>
            <tr>
              <th className="border p-2 text-left" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }} />
              {chart.series.map((s) => (
                <th key={s.name} scope="col" className="border p-2 text-center" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.labels.map((l, i) => (
              <tr key={l}>
                <th scope="row" className="border p-2 text-left font-semibold" style={{ borderColor: "var(--line)" }}>
                  {l}
                </th>
                {chart.series.map((s) => (
                  <td key={s.name} className="border p-2 text-center" style={{ borderColor: "var(--line)" }}>
                    {s.values[i]}
                    {chart.unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  }
  const W = 560;
  const H = 300;
  const pad = { l: 44, r: 12, t: 16, b: 36 };
  const all = chart.series.flatMap((s) => s.values);
  const rawMax = Math.max(...all);
  const step = rawMax > 500 ? 200 : rawMax > 100 ? 50 : rawMax > 30 ? 10 : rawMax > 12 ? 5 : 2;
  const max = Math.ceil((rawMax * 1.08) / step) * step;
  const ih = H - pad.t - pad.b;
  const iw = W - pad.l - pad.r;
  const y = (v: number) => pad.t + ih * (1 - v / max);
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const n = chart.labels.length;
  const group = iw / n;

  return (
    <figure className="rounded-[10px] border p-4" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      <figcaption className="mb-2 text-center text-sm font-bold">{chart.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={chart.title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={pad.l - 6} y={y(t) + 4} fontSize="11" textAnchor="end" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {chart.labels.map((l, i) => (
          <text key={l} x={pad.l + group * (i + 0.5)} y={H - 12} fontSize="12" textAnchor="middle" fill="var(--ink)">
            {l}
          </text>
        ))}
        {chart.kind === "bar"
          ? chart.series.map((s, si) => {
              const bw = Math.min(26, (group * 0.75) / chart.series.length);
              const offset = (group - bw * chart.series.length) / 2;
              return s.values.map((v, i) => (
                <rect
                  key={`${si}-${i}`}
                  x={pad.l + group * i + offset + bw * si}
                  y={y(v)}
                  width={bw - 2}
                  height={pad.t + ih - y(v)}
                  rx="3"
                  fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                >
                  <title>{`${s.name} · ${chart.labels[i]}: ${v}${chart.unit}`}</title>
                </rect>
              ));
            })
          : chart.series.map((s, si) => (
              <g key={si}>
                <path
                  d={s.values.map((v, i) => `${i ? "L" : "M"}${pad.l + group * (i + 0.5)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
                  strokeWidth="2.5"
                />
                {s.values.map((v, i) => (
                  <circle key={i} cx={pad.l + group * (i + 0.5)} cy={y(v)} r="3.5" fill={SERIES_COLORS[si % SERIES_COLORS.length]}>
                    <title>{`${s.name} · ${chart.labels[i]}: ${v}${chart.unit}`}</title>
                  </circle>
                ))}
              </g>
            ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs font-semibold">
        {chart.series.map((s, si) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }} />
            {s.name}
          </span>
        ))}
        <span style={{ color: "var(--muted)" }}>Unit: {chart.unit}</span>
      </div>
      <table className="sr-only">
        <caption>{chart.title}</caption>
        <thead>
          <tr>
            <th>Series</th>
            {chart.labels.map((l) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.series.map((s) => (
            <tr key={s.name}>
              <th>{s.name}</th>
              {s.values.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
