import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
import Snowflakes from './components/Snowflakes'
import useSiteStore from './store/siteStore'
import useThemeStore from './store/themeStore'
import { siteSettingsApi } from './api/siteSettings'
import Home from './pages/Home'
import RoleSelect from './pages/RoleSelect'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectsFeed from './pages/ProjectsFeed'
import ProjectDetail from './pages/ProjectDetail'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import AdminPanel from './pages/AdminPanel'
import Freelancers from './pages/Freelancers'
import ChatsPage from './pages/ChatsPage'
import Favorites from './pages/Favorites'
import AIAssistant from './pages/AIAssistant'
import MyWork from './pages/MyWork'
import Achievements from './pages/Achievements'
import ClientProfile from './pages/ClientProfile'
import NotFound from './pages/NotFound'

export default function App() {
  const setHolidayMode = useSiteStore(s => s.setHolidayMode)
  const holidayMode    = useSiteStore(s => s.holidayMode)
  const isDark         = useThemeStore(s => s.isDark)

  useEffect(() => {
    siteSettingsApi.getPublic()
      .then(r => setHolidayMode(r.data.holiday_mode))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (holidayMode) {
      root.style.setProperty('--accent',       isDark ? '#4BAECF' : '#1A8BB3')
      root.style.setProperty('--accent-green', '#48C9B0')
      root.style.setProperty('--accent-teal',  '#7DE8E0')
      root.style.setProperty('--border',       isDark ? 'rgba(74,174,207,0.1)'  : 'rgba(26,139,179,0.12)')
      root.style.setProperty('--border-hover', isDark ? 'rgba(74,174,207,0.45)' : 'rgba(26,139,179,0.45)')
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-green')
      root.style.removeProperty('--accent-teal')
      root.style.removeProperty('--border')
      root.style.removeProperty('--border-hover')
    }
  }, [holidayMode, isDark])

  return (
    <BrowserRouter>
      <Toast />
      {holidayMode && <Snowflakes />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/role" element={<RoleSelect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/freelancers" element={<Freelancers />} />
        <Route path="/projects" element={<ProjectsFeed />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/client/:id" element={<ClientProfile />} />
        <Route path="/achievements" element={<Achievements />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute requireRole="client"><CreateProject /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute requireRole="client"><EditProject /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />

        <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/my-work" element={<ProtectedRoute requireRole="freelancer"><MyWork /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminPanel /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
