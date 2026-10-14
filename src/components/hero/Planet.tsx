/**
 * Planet — vermilion sphere with radial-gradient shading, thin limb glow,
 * terminator shadow, plus a sand-coloured ring drawn as an SVG ellipse
 * split into back half (behind) and front half (in front) for 3D depth.
 */
export default function Planet() {
  /*
   * Ring ellipse geometry: rx=240 ry=60, centre at 250,250.
   * The "back" half is the top arc (behind the planet).
   * The "front" half is the bottom arc (in front of the planet).
   * Split via two semicircular arcs.
   */
  const cx = 250
  const cy = 250
  const rx = 240
  const ry = 60

  /* Top arc: left -> right (back half, behind planet) */
  const backD = `M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy}`
  /* Bottom arc: right -> left (front half, in front of planet) */
  const frontD = `M ${cx + rx},${cy} A ${rx},${ry} 0 0,1 ${cx - rx},${cy}`

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
        </svg>

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
        </svg>
      </div>
    </div>
  )
}
