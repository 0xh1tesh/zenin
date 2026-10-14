import { Link } from 'react-router-dom'

interface BrowseTile {
  icon: string
  label: string
  sub: string
  to: string
  param: string
}

const TILES: BrowseTile[] = [
  {
    icon: '⚙️',
    label: 'Technical',
    sub: 'Hackathons, Coding, Robotics & AI',
    to: '/events?kind=technical',
    param: 'kind=technical',
  },
  {
    icon: '🎭',
    label: 'Cultural',
    sub: 'Dance, Theatre, Photography & Music',
    to: '/events?kind=cultural',
    param: 'kind=cultural',
  },
  {
    icon: '🛠',
    label: 'Workshops',
    sub: 'Hands-on sessions & skill labs',
    to: '/events?type=workshop',
    param: 'type=workshop',
  },
  {
    icon: '🌐',
    label: 'Online',
    sub: 'Participate from anywhere',
    to: '/events?mode=online',
    param: 'mode=online',
  },
  {
    icon: '🎟',
    label: 'Free Events',
    sub: 'No registration fee required',
    to: '/events?price=free',
    param: 'price=free',
  },
  {
    icon: '🏛',
    label: 'On-Campus',
    sub: 'In-person at Pune venues',
    to: '/events?mode=offline',
    param: 'mode=offline',
  },
  {
    icon: '📅',
    label: 'Events',
    sub: 'Competitions, quizzes & shows',
    to: '/events?type=event',
    param: 'type=event',
  },
  {
    icon: '🔖',
    label: 'All Events',
    sub: 'Browse the full programme',
    to: '/events',
    param: '',
  },
]

export default function BrowseByKind() {
  return (
    <section className="home-browse home-section--ruled" aria-label="Browse events by category">
      <div className="home-browse__inner">
        <div className="home-browse__header home-section__header">
          <h2 className="home-section__title">Browse by kind</h2>
        </div>

        <nav aria-label="Event category links">
          <ul className="home-browse__grid" role="list">
            {TILES.map((tile) => (
              <li key={tile.to} role="listitem">
                <Link
                  to={tile.to}
                  className="home-browse-tile"
                  aria-label={`Browse ${tile.label} events`}
                >
                  <span className="home-browse-tile__icon" aria-hidden="true">
                    {tile.icon}
                  </span>
                  <span className="home-browse-tile__label">{tile.label}</span>
                  <span className="home-browse-tile__sub">{tile.sub}</span>
                  <span className="home-browse-tile__arrow" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
