export function Sparkline({
  values,
  width = 120,
  height = 32,
  className,
  stroke = "var(--br-success-fg)",
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const x = (i: number) => (i / (values.length - 1)) * (width - 4) + 2;
  const y = (v: number) => height - 2 - ((v - min) / (max - min)) * (height - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values.at(-1) ?? 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={`${d} L${x(values.length - 1)} ${height} L2 ${height} Z`} fill={stroke} opacity="0.12" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r="2.5" fill={stroke} />
    </svg>
  );
}

export function scoreTone(score: number, threshold = 80): "success" | "attention" | "danger" {
  if (score >= threshold) return "success";
  if (score >= threshold - 15) return "attention";
  return "danger";
}
