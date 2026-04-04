import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '练习', icon: '📝' },
  { to: '/history', label: '历史', icon: '📊' },
  { to: '/favorites', label: '收藏', icon: '⭐' },
  { to: '/import', label: '导入', icon: '📁' },
]

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
    {tabs.map(({ to, label, icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }`
        }
      >
        <span className="text-lg leading-none">{icon}</span>
        {label}
      </NavLink>
    ))}
  </nav>
)
