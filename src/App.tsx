import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './store/context'
import { Home } from './pages/Home'
import { Import } from './pages/Import'
import { Quiz } from './pages/Quiz'
import { Result } from './pages/Result'
import { History } from './pages/History'
import { Favorites } from './pages/Favorites'
import { BottomNav } from './components/BottomNav'

const HIDE_NAV = ['/quiz', '/result']

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p))
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 relative">
      {children}
      {!hideNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<Import />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  )
}
