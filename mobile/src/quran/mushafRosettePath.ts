/** Мұсаф басылымындағы аят соңы белгісі — тісті дөңгелек контур. */
export function mushafRosettePath(cx: number, cy: number, baseR: number, lobes = 12): string {
  const steps = lobes * 2;
  const amp = baseR * 0.11;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? baseR + amp : baseR - amp * 0.4;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d} Z`;
}
