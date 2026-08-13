import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Header from '../components/Layout/Header'
import Sidebar, { MobileBottomNav } from '../components/Layout/Sidebar'
import SimulationLoading from '../components/simulation/SimulationLoading'
import Dashboard from '../components/Dashboard/Dashboard'
import SubjectPage from './SubjectPage'
import SimulationsPage from './SimulationsPage'
import SimulationPage from './SimulationPage'
import ProgressPage from './ProgressPage'
import FavoritesPage from './FavoritesPage'
import ExperimentsPage from './ExperimentsPage'

export default function Lab() {
  return (
    <div className="lab-layout">
      <Sidebar />
      <div className="lab-main">
        <Header />
        <Suspense fallback={<div className="page"><SimulationLoading /></div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/physics" element={<SubjectPage subject="physics" />} />
            <Route path="/chemistry" element={<SubjectPage subject="chemistry" />} />
            <Route path="/simulations" element={<SimulationsPage type="simulation" />} />
            <Route path="/simulations/:id" element={<SimulationPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Routes>
        </Suspense>
      </div>
      <MobileBottomNav />
    </div>
  )
}
