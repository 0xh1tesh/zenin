/**
 * Real astronomical constellation shapes, coordinates, line paths,
 * and display metadata.
 */

export interface ConstellationStar {
  id: string
  x: number
  y: number
  r: number
  color?: string
  isPrimary?: boolean
}

export interface ConstellationData {
  id: string
  name: string
  label: string
  viewBox: string
  width: number
  height: number
  pathD: string
  lineLength: number
  stars: ConstellationStar[]
  position: { top: string; left?: string; right?: string }
  mobilePosition?: { top: string; left?: string; right?: string }
  isMobile: boolean
  desktopIndex: number
  mobileIndex: number
}

/**
 * Real astronomical constellation shapes with SVG path strings,
 * star coordinates, and mono labels.
 */
export const CONSTELLATIONS: ConstellationData[] = [
  {
    id: 'orion',
    name: 'Orion',
    label: 'ORION · THE HUNTER',
    viewBox: '0 0 200 240',
    width: 170,
    height: 204,
    pathD:
      'M 100 25 L 55 60 L 145 65 L 100 25 M 55 60 L 85 125 M 145 65 L 115 129 M 85 125 L 100 127 L 115 129 M 100 127 L 100 155 M 85 125 L 65 205 M 115 129 L 145 195 M 65 205 L 145 195',
    lineLength: 640,
    stars: [
      { id: 'meissa', x: 100, y: 25, r: 2.2, color: 'var(--sand)' },
      { id: 'betelgeuse', x: 55, y: 60, r: 3.6, color: 'var(--coral)', isPrimary: true },
      { id: 'bellatrix', x: 145, y: 65, r: 2.8, color: 'var(--bone)' },
      { id: 'alnitak', x: 85, y: 125, r: 2.4, color: 'var(--sand)' },
      { id: 'alnilam', x: 100, y: 127, r: 2.5, color: 'var(--sand)' },
      { id: 'mintaka', x: 115, y: 129, r: 2.4, color: 'var(--sand)' },
      { id: 'sword', x: 100, y: 155, r: 1.8, color: 'var(--blue)' },
      { id: 'saiph', x: 65, y: 205, r: 2.6, color: 'var(--sand)' },
      { id: 'rigel', x: 145, y: 195, r: 3.5, color: 'var(--bone)', isPrimary: true },
    ],
    position: { top: '8%', right: '3%' },
    mobilePosition: { top: '10%', right: '2%' },
    isMobile: true,
    desktopIndex: 0,
    mobileIndex: 0,
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    label: 'CASSIOPEIA · THE QUEEN',
    viewBox: '0 0 200 140',
    width: 160,
    height: 112,
    pathD: 'M 25 45 L 65 105 L 105 35 L 145 95 L 180 40',
    lineLength: 300,
    stars: [
      { id: 'segin', x: 25, y: 45, r: 2.4, color: 'var(--sand)' },
      { id: 'ruchbah', x: 65, y: 105, r: 2.6, color: 'var(--sand)' },
      { id: 'navi', x: 105, y: 35, r: 3.2, color: 'var(--bone)', isPrimary: true },
      { id: 'schedar', x: 145, y: 95, r: 3.0, color: 'var(--coral)' },
      { id: 'caph', x: 180, y: 40, r: 2.8, color: 'var(--sand)' },
    ],
    position: { top: '21%', left: '2%' },
    mobilePosition: { top: '42%', left: '2%' },
    isMobile: true,
    desktopIndex: 1,
    mobileIndex: 1,
  },
  {
    id: 'ursa-major',
    name: 'Big Dipper',
    label: 'URSA MAJOR · BIG DIPPER',
    viewBox: '0 0 220 160',
    width: 176,
    height: 128,
    pathD: 'M 20 130 L 55 115 L 90 105 L 125 95 L 120 145 L 170 140 L 175 90 L 125 95',
    lineLength: 320,
    stars: [
      { id: 'alkaid', x: 20, y: 130, r: 2.6, color: 'var(--sand)' },
      { id: 'mizar', x: 55, y: 115, r: 2.8, color: 'var(--bone)' },
      { id: 'alioth', x: 90, y: 105, r: 3.0, color: 'var(--sand)' },
      { id: 'megrez', x: 125, y: 95, r: 2.4, color: 'var(--sand)' },
      { id: 'phecda', x: 120, y: 145, r: 2.6, color: 'var(--sand)' },
      { id: 'merak', x: 170, y: 140, r: 2.8, color: 'var(--sand)' },
      { id: 'dubhe', x: 175, y: 90, r: 3.4, color: 'var(--coral)', isPrimary: true },
    ],
    position: { top: '35%', right: '4%' },
    isMobile: false,
    desktopIndex: 2,
    mobileIndex: -1,
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    label: 'CYGNUS · NORTHERN CROSS',
    viewBox: '0 0 200 200',
    width: 160,
    height: 160,
    pathD: 'M 100 25 L 100 175 M 35 90 L 100 95 L 165 100 L 190 115',
    lineLength: 320,
    stars: [
      { id: 'deneb', x: 100, y: 25, r: 3.6, color: 'var(--bone)', isPrimary: true },
      { id: 'sadr', x: 100, y: 95, r: 3.0, color: 'var(--sand)' },
      { id: 'albireo', x: 100, y: 175, r: 2.8, color: 'var(--coral)' },
      { id: 'gienah', x: 35, y: 90, r: 2.6, color: 'var(--sand)' },
      { id: 'delta-cyg', x: 165, y: 100, r: 2.6, color: 'var(--sand)' },
      { id: 'fawaris', x: 190, y: 115, r: 2.0, color: 'var(--muted)' },
    ],
    position: { top: '48%', left: '3%' },
    mobilePosition: { top: '75%', right: '2%' },
    isMobile: true,
    desktopIndex: 3,
    mobileIndex: 2,
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    label: 'SCORPIUS · THE SCORPION',
    viewBox: '0 0 180 230',
    width: 144,
    height: 184,
    pathD: 'M 20 75 L 45 70 L 35 40 M 45 70 L 65 105 L 85 145 L 100 185 L 125 205 L 145 175 L 150 155',
    lineLength: 280,
    stars: [
      { id: 'graffias', x: 35, y: 40, r: 2.4, color: 'var(--sand)' },
      { id: 'dschubba', x: 45, y: 70, r: 2.6, color: 'var(--sand)' },
      { id: 'antares', x: 65, y: 105, r: 3.8, color: 'var(--coral)', isPrimary: true },
      { id: 'wei', x: 85, y: 145, r: 2.4, color: 'var(--sand)' },
      { id: 'larawag', x: 100, y: 185, r: 2.4, color: 'var(--sand)' },
      { id: 'sargas', x: 125, y: 205, r: 2.8, color: 'var(--sand)' },
      { id: 'shaula', x: 145, y: 175, r: 3.0, color: 'var(--bone)' },
      { id: 'lesath', x: 150, y: 155, r: 2.2, color: 'var(--sand)' },
    ],
    position: { top: '63%', right: '2%' },
    isMobile: false,
    desktopIndex: 4,
    mobileIndex: -1,
  },
  {
    id: 'lyra',
    name: 'Lyra',
    label: 'LYRA · THE HARP',
    viewBox: '0 0 160 180',
    width: 136,
    height: 153,
    pathD: 'M 55 30 L 65 85 L 110 95 L 120 155 L 75 145 L 65 85 M 55 30 L 85 45 L 110 95',
    lineLength: 360,
    stars: [
      { id: 'vega', x: 55, y: 30, r: 4.0, color: 'var(--bone)', isPrimary: true },
      { id: 'eps-lyr', x: 85, y: 45, r: 2.0, color: 'var(--sand)' },
      { id: 'zeta-lyr', x: 65, y: 85, r: 2.4, color: 'var(--sand)' },
      { id: 'delta-lyr', x: 110, y: 95, r: 2.4, color: 'var(--sand)' },
      { id: 'sheliak', x: 75, y: 145, r: 2.8, color: 'var(--coral)' },
      { id: 'sulafat', x: 120, y: 155, r: 2.8, color: 'var(--sand)' },
    ],
    position: { top: '75%', left: '4%' },
    isMobile: false,
    desktopIndex: 5,
    mobileIndex: -1,
  },
  {
    id: 'leo',
    name: 'Leo',
    label: 'LEO · THE LION',
    viewBox: '0 0 210 160',
    width: 168,
    height: 128,
    pathD:
      'M 50 30 L 40 60 L 75 65 L 60 125 M 75 65 L 145 65 L 190 85 L 140 115 L 60 125 M 145 65 L 140 115',
    lineLength: 450,
    stars: [
      { id: 'rasalas', x: 50, y: 30, r: 2.2, color: 'var(--sand)' },
      { id: 'adhafera', x: 40, y: 60, r: 2.4, color: 'var(--sand)' },
      { id: 'algieba', x: 75, y: 65, r: 2.8, color: 'var(--sand)' },
      { id: 'regulus', x: 60, y: 125, r: 3.6, color: 'var(--coral)', isPrimary: true },
      { id: 'zosma', x: 145, y: 65, r: 2.6, color: 'var(--sand)' },
      { id: 'chertan', x: 140, y: 115, r: 2.4, color: 'var(--sand)' },
      { id: 'denebola', x: 190, y: 85, r: 3.0, color: 'var(--bone)' },
    ],
    position: { top: '87%', right: '3%' },
    isMobile: false,
    desktopIndex: 6,
    mobileIndex: -1,
  },
  {
    id: 'crux',
    name: 'Crux',
    label: 'CRUX · SOUTHERN CROSS',
    viewBox: '0 0 160 180',
    width: 128,
    height: 144,
    pathD: 'M 80 25 L 80 155 M 30 90 L 130 85',
    lineLength: 240,
    stars: [
      { id: 'gacrux', x: 80, y: 25, r: 3.0, color: 'var(--coral)' },
      { id: 'acrux', x: 80, y: 155, r: 3.6, color: 'var(--bone)', isPrimary: true },
      { id: 'mimosa', x: 30, y: 90, r: 3.2, color: 'var(--sand)' },
      { id: 'delta-cru', x: 130, y: 85, r: 2.8, color: 'var(--sand)' },
      { id: 'eps-cru', x: 105, y: 110, r: 1.8, color: 'var(--muted)' },
    ],
    position: { top: '93%', left: '2%' },
    isMobile: false,
    desktopIndex: 7,
    mobileIndex: -1,
  },
]

export function filterConstellationsForMobile(
  constellations: ConstellationData[]
): ConstellationData[] {
  return constellations.filter((c) => c.isMobile)
}
