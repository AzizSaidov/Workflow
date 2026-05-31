import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProjectCard from '../components/ProjectCard'
import Button from '../components/Button'
import Tag from '../components/Tag'

const STATUS_TABS = [
  { key: '', label: 'Все' },
  { key: 'open', label: 'Открытые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'delivered', label: 'Сданные' },
  { key: 'completed', label: 'Завершённые' },
]

export default function DashboardClient() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/users/me/stats').then(r => setStats(r.data)).catch(() => {})
    projectsApi.getAll({}).then(r => {
      const myProjects = (r.data || []).filter(p => p.client_id === user?.id)
      setProjects(myProjects)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.id])

  const filtered = activeTab ? projects.filter(p => p.status === activeTab) : projects

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Добро пожаловать</p>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)' }}>
                {user?.full_name}
              </h1>
            </div>
            <Link to="/projects/new">
              <Button variant="primary" icon="plus">Новый проект</Button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { icon: 'briefcase', label: 'Всего проектов', value: stats?.total_projects ?? '—', color: 'var(--accent)' },
              { icon: 'loader-2', label: 'В работе', value: stats?.active_projects ?? '—', color: '#EF9F27' },
              { icon: 'circle-check', label: 'Завершено', value: stats?.completed_projects ?? '—', color: 'var(--accent-green)' },
              { icon: 'wallet', label: 'Потрачено (TJS)', value: stats?.total_spent ? Number(stats.total_spent).toLocaleString() : '—', color: 'var(--accent-teal)' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {tab.label}
                {tab.key && projects.filter(p => p.status === tab.key).length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                    {projects.filter(p => p.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Projects grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 160, borderRadius: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)', opacity: 0.5 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <i className="ti ti-briefcase-off" style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 16, opacity: 0.35 }} />
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 }}>
                {activeTab ? 'Нет проектов в этом статусе' : 'У тебя пока нет проектов'}
              </p>
              <Link to="/projects/new">
                <Button variant="primary" icon="plus">Создать первый проект</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
