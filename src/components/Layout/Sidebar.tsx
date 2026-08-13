import { BarChart3, Beaker, Gauge, Heart, Home, Orbit, TestTube2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { label: 'Dashboard', to: '/lab', icon: Home },
  { label: 'Physics', to: '/lab/physics', icon: Orbit },
  { label: 'Chemistry', to: '/lab/chemistry', icon: Beaker },
  { label: 'Simulations', to: '/lab/simulations', icon: Gauge },
  { label: 'Experiments', to: '/lab/experiments', icon: TestTube2 },
  { label: 'Progress', to: '/lab/progress', icon: BarChart3 },
  { label: 'Favorites', to: '/lab/favorites', icon: Heart }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">S3D</div>
        <div>
          <div className="brand__title">Science 3D</div>
          <div className="brand__tagline">See the science. Interact with it.</div>
        </div>
      </div>
      <nav aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink className="nav-link" key={item.to} to={item.to} end={item.to === '/lab'}>
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.slice(0, 5).map((item) => {
        const Icon = item.icon
        return (
          <NavLink key={item.to} to={item.to} end={item.to === '/lab'}>
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
