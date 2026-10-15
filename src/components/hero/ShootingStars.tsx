/**
 * ShootingStars — subtle cosmic streaks across the hero sky at staggered intervals.
 * Driven by pure CSS transforms with long delays; aria-hidden and pointer-events none.
 * Automatically limited to 2 streaks on mobile and disabled for reduced motion.
 */
export default function ShootingStars() {
  return (
    <div className="hero__shooting-stars" aria-hidden="true">
      <div className="hero__shooting-star hero__shooting-star--1" />
      <div className="hero__shooting-star hero__shooting-star--2" />
      <div className="hero__shooting-star hero__shooting-star--3" />
    </div>
  )
}
