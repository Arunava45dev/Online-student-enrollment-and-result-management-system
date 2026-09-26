// The signature element: a wax-seal monogram, styled like an
// embossed registrar's stamp. Used on auth screens and the topbar.
// size in px; tone "red" (auth hero) or "paper" (topbar, on dark ink).
export default function Seal({ size = 96, tone = "red" }) {
  const ring = tone === "red" ? "#F1EEE2" : "#8A2E32";
  const fill = tone === "red" ? "#8A2E32" : "#F1EEE2";
  const sub = tone === "red" ? "rgba(241,238,226,0.55)" : "rgba(138,46,50,0.55)";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="57" fill={fill} />
      <circle cx="60" cy="60" r="57" stroke={ring} strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="47" stroke={ring} strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4.6" />
      {/* radiating ticks */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const r1 = 51;
        const r2 = i % 3 === 0 ? 44 : 47.5;
        const x1 = 60 + r1 * Math.cos(angle);
        const y1 = 60 + r1 * Math.sin(angle);
        const x2 = 60 + r2 * Math.cos(angle);
        const y2 = 60 + r2 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={sub} strokeWidth="1" />;
      })}
      {/* monogram */}
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="600"
        fontSize="42"
        fill={ring}
      >
        R
      </text>
      <path d="M38 84 Q60 92 82 84" stroke={ring} strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
