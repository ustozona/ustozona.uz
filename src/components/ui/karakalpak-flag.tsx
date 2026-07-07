/** Qoraqalpogʻiston bayrogʻi — rasmiy emoji kodi yoʻqligi sabab qoʻlda chizilgan SVG.
    Oʻzbekiston bayrogʻining kanton uslubiga oʻxshash (yarim oy + yulduzlar), lekin
    oʻrtada oq chiziq yoʻq va 12 emas 5 ta yulduz — Qoraqalpogʻiston bayrogʻiga mos
    koʻk/qizil/sariq/qizil/yashil gorizontal chiziqlar. */
function starPoints(cx: number, cy: number, outerR: number, innerR: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const STAR_CENTERS: [number, number][] = [
  [300, 95],
  [365, 95],
  [430, 95],
  [330, 155],
  [395, 155],
];

export function KarakalpakFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 600" className={className} aria-hidden="true">
      <rect width="1200" height="600" fill="#1591c6" />
      <rect y="230" width="1200" height="20" fill="#d0202e" />
      <rect y="250" width="1200" height="100" fill="#f5b800" />
      <rect y="350" width="1200" height="20" fill="#d0202e" />
      <rect y="370" width="1200" height="230" fill="#2e9e4d" />
      <g fill="#fff">
        <path d="M 205 55 A 70 70 0 1 0 205 195 A 56 56 0 1 1 205 55 Z" />
        {STAR_CENTERS.map(([cx, cy]) => (
          <polygon key={`${cx}-${cy}`} points={starPoints(cx, cy, 22, 8.5)} />
        ))}
      </g>
    </svg>
  );
}
