export interface TileConstellationProps {
  categoryKey: string
}

interface Point {
  x: number
  y: number
}

interface ConstellationData {
  points: Point[]
  path: string
}

const CONSTELLATIONS: Record<string, ConstellationData> = {
  technical: {
    // Angular circuit/diamond constellation (Orion/Cygnus inspired)
    points: [
      { x: 12, y: 15 },
      { x: 38, y: 8 },
      { x: 55, y: 32 },
      { x: 30, y: 52 },
      { x: 14, y: 38 },
    ],
    path: 'M 12 15 L 38 8 L 55 32 L 30 52 L 14 38 Z M 38 8 L 30 52',
  },
  cultural: {
    // Lyra / curving arc constellation
    points: [
      { x: 10, y: 44 },
      { x: 22, y: 22 },
      { x: 44, y: 14 },
      { x: 58, y: 28 },
      { x: 48, y: 50 },
    ],
    path: 'M 10 44 L 22 22 L 44 14 L 58 28 L 48 50 Z M 22 22 L 48 50',
  },
  workshops: {
    // Cassiopeia distinctive zigzag W constellation
    points: [
      { x: 8, y: 18 },
      { x: 22, y: 46 },
      { x: 34, y: 24 },
      { x: 48, y: 50 },
      { x: 60, y: 16 },
    ],
    path: 'M 8 18 L 22 46 L 34 24 L 48 50 L 60 16',
  },
  online: {
    // Crux / satellite cross constellation
    points: [
      { x: 34, y: 8 },
      { x: 34, y: 54 },
      { x: 14, y: 30 },
      { x: 54, y: 30 },
      { x: 42, y: 42 },
    ],
    path: 'M 34 8 L 34 54 M 14 30 L 54 30 M 54 30 L 42 42',
  },
  free: {
    // Dipper / open scoop constellation
    points: [
      { x: 10, y: 14 },
      { x: 26, y: 20 },
      { x: 38, y: 34 },
      { x: 56, y: 36 },
      { x: 50, y: 54 },
      { x: 34, y: 50 },
    ],
    path: 'M 10 14 L 26 20 L 38 34 L 56 36 L 50 54 L 34 50 L 38 34',
  },
}

export default function TileConstellation({ categoryKey }: TileConstellationProps) {
  const data = CONSTELLATIONS[categoryKey] ?? CONSTELLATIONS.technical

  return (
    <div className="tile-constellation" aria-hidden="true">
      <svg
        viewBox="0 0 68 64"
        className="tile-constellation__svg"
        aria-hidden="true"
      >
        {/* Glow filter with explicit userSpaceOnUse bounds per spec */}
        <defs>
          <filter
            id={`constellation-glow-${categoryKey}`}
            filterUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="108"
            height="104"
          >
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drawn constellation lines */}
        <path
          d={data.path}
          className="constellation__line"
          stroke="var(--sand)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#constellation-glow-${categoryKey})`}
        />

        {/* Star vertices that twinkle at rest */}
        {data.points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={idx === 1 ? 2.4 : 1.8}
            className="constellation__star"
            style={{ '--star-delay': `${idx * 0.45}s` } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  )
}
