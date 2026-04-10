import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Scrapbook from './pages/Scrapbook'
import Timeline from './pages/Timeline'
import MapPage from './pages/MapPage'
import Stats from './pages/Stats'
import FamilyTree from './pages/FamilyTree'
import Login from './pages/Login'
import Navbar from './components/Navbar'
import BirthInfoModal from './components/BirthInfoModal'

function AppShell() {
  const navigate = useNavigate()
  const [birthInfo, setBirthInfo] = useState(
    () => JSON.parse(localStorage.getItem('my-story-birth') || 'null')
  )

  const handleBirthComplete = (info) => {
    localStorage.setItem('my-story-birth', JSON.stringify(info))
    setBirthInfo(info)
  }

  const handleLogout = () => {
    localStorage.removeItem('my-story-birth')
    setBirthInfo(null)
    navigate('/login')
  }

  return (
    <>
      {!birthInfo && <BirthInfoModal onComplete={handleBirthComplete} />}
      <Navbar onLogout={handleLogout} />
      <Routes>
        <Route path="/scrapbook"    element={<Scrapbook />} />
        <Route path="/timeline"     element={<Timeline />} />
        <Route path="/map"          element={<MapPage />} />
        <Route path="/stats"        element={<Stats />} />
        <Route path="/family-tree"  element={<FamilyTree />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/*"      element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
