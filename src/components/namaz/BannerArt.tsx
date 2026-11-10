/** Banner landscape: layered hills and a mosque, the sky following the time of day. */
export type Phase = 'dawn' | 'day' | 'sunset' | 'night';

const SKY: Record<Phase, [string, string, string]> = {
  dawn: ['#3b4a6b', '#a98fa8', '#f2c6a0'],
  day: ['#6f93ad', '#a9c3cf', '#dde7e4'],
  sunset: ['#3c3a5c', '#b0697a', '#f0a774'],
  night: ['#0b1324', '#1b2a44', '#2d3c57'],
};
const HILLS: Record<Phase, [string, string, string]> = {
  dawn: ['#6a6f86', '#4d536b', '#2f3448'],
  day: ['#7f9a8f', '#5d776c', '#3c5148'],
  sunset: ['#6c5a6e', '#4b3f52', '#2c2535'],
  night: ['#25324a', '#1a2538', '#0f1726'],
};

export default function BannerArt({ phase, id }: { phase: Phase; id: string }) {
  const [a, b, c] = SKY[phase];
  const [h1, h2, h3] = HILLS[phase];
  const sun = phase === 'day' ? { cx: 760, cy: 46, r: 22, fill: '#fff6dc' } : phase === 'dawn' ? { cx: 300, cy: 120, r: 26, fill: '#ffe2b8' } : phase === 'sunset' ? { cx: 680, cy: 118, r: 28, fill: '#ffc58f' } : null;
  return (
    <svg viewBox="0 0 1000 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.15" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1000" height="170" fill={`url(#${id}-sky)`} />
      {phase === 'night' && (
        <g fill="#fff">
          {[[120, 30], [210, 60], [330, 22], [460, 48], [560, 18], [640, 66], [720, 30], [860, 54], [930, 20], [400, 80]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.6} opacity={0.8} />
          ))}
          <path d="M800 40a18 18 0 1 0 14 29 15 15 0 1 1-14-29z" fill="#f4ecd2" />
        </g>
      )}
      {sun && <circle {...sun} opacity="0.9" />}
      <path d="M0 110 L80 78 L150 96 L230 60 L320 92 L400 70 L480 98 L560 64 L650 90 L740 58 L830 86 L920 66 L1000 84 L1000 170 L0 170Z" fill={h1} opacity="0.8" />
      <path d="M0 132 L110 100 L210 122 L320 92 L430 124 L540 98 L650 126 L760 100 L880 122 L1000 104 L1000 170 L0 170Z" fill={h2} />
      {/* mosque on the right ridge */}
      <g fill={h3}>
        <rect x="848" y="112" width="70" height="30" />
        <path d="M858 114 a25 25 0 0 1 50 0z" />
        <rect x="881" y="80" width="4" height="10" />
        <rect x="928" y="78" width="8" height="64" />
        <path d="M928 80 l4 -14 l4 14z" />
        <rect x="834" y="92" width="6" height="50" />
        <path d="M834 94 l3 -11 l3 11z" />
      </g>
      <path d="M0 150 C 200 130, 380 150, 560 138 S 860 132, 1000 146 L1000 170 L0 170Z" fill={h3} />
      <rect width="1000" height="170" fill={`url(#${id}-shade)`} />
    </svg>
  );
}
