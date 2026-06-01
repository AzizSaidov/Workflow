import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
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

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/role" element={<RoleSelect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/freelancers" element={<ProtectedRoute><Freelancers /></ProtectedRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsFeed /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><EditProject /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
