/**
 * Planet — vermilion sphere with radial-gradient shading, breathing atmosphere glow,
 * terminator shadow, plus double sand-coloured rings drawn as SVG ellipses
 * split into back half (behind) and front half (in front) for 3D depth and precession.
 */
export default function Planet() {
  /*
   * Ring ellipse geometry: centre at 250,250.
   * Primary ring: rx=240 ry=60.
   * Secondary outer faint ring: rx=265 ry=66.
   * Split via semicircular arcs into back half (top arc) and front half (bottom arc).
   */
  const cx = 250
  const cy = 250
  const rx = 240
  const ry = 60
  const rx2 = 265
  const ry2 = 66

  /* Top arcs: left -> right (back half, behind planet) */
  const backD = `M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy}`
  const backD2 = `M ${cx - rx2},${cy} A ${rx2},${ry2} 0 0,1 ${cx + rx2},${cy}`

  /* Bottom arcs: right -> left (front half, in front of planet) */
  const frontD = `M ${cx + rx},${cy} A ${rx},${ry} 0 0,1 ${cx - rx},${cy}`
  const frontD2 = `M ${cx + rx2},${cy} A ${rx2},${ry2} 0 0,1 ${cx - rx2},${cy}`

  return (
    <div className="hero__planet" aria-hidden="true">
      <div className="hero__planet-wrap">
        {/* Ring back half (behind the planet sphere) */}
        <svg
          className="hero__ring-svg"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid meet"
          style={{ zIndex: 0 }}
        >
          <path className="hero__ring-back" d={backD} />
          <path className="hero__ring-back hero__ring-back--outer" d={backD2} />
        </svg>

        {/* Shimmering atmosphere outer glow */}
        <div className="hero__planet-atmosphere" />

        {/* The planet sphere */}
        <div className="hero__planet-sphere" />

        {/* Ring front half (in front of the planet sphere) */}
        <svg
          className="hero__ring-svg"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid meet"
          style={{ zIndex: 2 }}
        >
          <path className="hero__ring-front" d={frontD} />
          <path className="hero__ring-front hero__ring-front--outer" d={frontD2} />
        </svg>
      </div>
    </div>
  )
}
