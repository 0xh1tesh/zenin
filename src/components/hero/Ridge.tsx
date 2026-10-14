/** Foreground silhouettes: two jagged ridge lines, the nearer one rim-lit in coral. */
const FAR = 'M0,300 L0,190 L90,160 L170,200 L260,140 L360,185 L470,120 L560,170 L660,130 L770,190 L860,150 L960,205 L1070,135 L1170,180 L1270,140 L1360,175 L1440,150 L1440,300 Z'
const NEAR_EDGE = 'M0,235 L120,215 L230,250 L340,205 L460,245 L590,215 L710,260 L830,225 L960,255 L1090,215 L1210,248 L1330,222 L1440,240'
const NEAR = `${NEAR_EDGE} L1440,300 L0,300 Z`

export default function Ridge() {
  return (
    <div className="hero__ridge" aria-hidden="true">
      <svg viewBox="0 0 1440 300" preserveAspectRatio="none">
        <path className="hero__ridge-fill" d={FAR} opacity="0.85" />
        <path className="hero__ridge-fill hero__ridge-fill--near" d={NEAR} />
        <path className="hero__ridge-rim" d={NEAR_EDGE} />
      </svg>
    </div>
  )
}
