import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { favoritesApi } from '../api/favorites'
import { projectsApi } from '../api/projects'
import { profilesApi } from '../api/profiles'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Rating from '../components/Rating'
import Tag from '../components/Tag'
import useToastStore from '../store/toastStore'

export default function Favorites() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const toast = useToastStore(s => s.show)

  const [tab, setTab] = useState('freelancers')
  const [loading, setLoading] = useState(true)

  const [freelancers, setFreelancers] = useState([]) // { fav, user, profile }
  const [projects, setProjects] = useState([])       // { fav, project }

  const load = async () => {
    setLoading(true)
    try {
      const { data: favs } = await favoritesApi.getAll()
      const flFavs = (favs || []).filter(f => f.freelancer_id)
      const prFavs = (favs || []).filter(f => f.project_id)

      const [flData, prData] = await Promise.all([
        Promise.all(flFavs.map(f =>
          Promise.all([
            client.get(`/users/${f.freelancer_id}`),
            profilesApi.get(f.freelancer_id).catch(() => ({ data: null })),
          ]).then(([u, p]) => ({ fav: f, user: u.data, profile: p.data }))
        )),
        Promise.all(prFavs.map(f =>
          projectsApi.getOne(f.project_id)
            .then(r => ({ fav: f, project: r.data }))
            .catch(() => null)
        )),
      ])

      setFreelancers(flData.filter(Boolean))
      setProjects(prData.filter(Boolean))
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const removeFreelancer = async (favId, freelancerId) => {
    await favoritesApi.removeFreelancer(freelancerId).catch(() => {})
    setFreelancers(prev => prev.filter(f => f.fav.id !== favId))
    toast('Удалено из избранного', 'info')
  }

  const removeProject = async (favId, projectId) => {
    await favoritesApi.removeProject(projectId).catch(() => {})
    setProjects(prev => prev.filter(p => p.fav.id !== favId))
    toast('Удалено из избранного', 'info')
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
              Избранное
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Сохранённые фрилансеры и проекты
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '0.5px solid var(--border)', paddingBottom: 0 }}>
            {[
              { key: 'freelancers', label: 'Фрилансеры', icon: 'users', count: freelancers.length },
              { key: 'projects',    label: 'Проекты',    icon: 'briefcase', count: projects.length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                <i className={`ti ti-${t.icon}`} style={{ fontSize: 15, color: tab === t.key ? 'var(--accent)' : 'inherit' }} />
                {t.label}
                {!loading && (
                  <span style={{
                    padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: tab === t.key ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.06)',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загружаем…</div>
            </div>
          ) : tab === 'freelancers' ? (
            freelancers.length === 0 ? (
              <EmptyState
                icon="users"
                text="Нет сохранённых фрилансеров"
                sub="Добавляйте понравившихся специалистов в избранное"
                linkTo="/freelancers"
                linkLabel="Найти фрилансеров"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {freelancers.map(({ fav, user: u, profile: p }) => (
                  <FreelancerFavCard
                    key={fav.id}
                    user={u}
                    profile={p}
                    isDark={isDark}
                    onRemove={() => removeFreelancer(fav.id, fav.freelancer_id)}
                  />
                ))}
              </div>
            )
          ) : (
            projects.length === 0 ? (
              <EmptyState
                icon="briefcase"
                text="Нет сохранённых проектов"
                sub="Добавляйте интересные проекты в избранное"
                linkTo="/projects"
                linkLabel="Найти проекты"
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {projects.map(({ fav, project: p }) => (
                  <ProjectFavCard
                    key={fav.id}
                    project={p}
                    isDark={isDark}
                    onRemove={() => removeProject(fav.id, fav.project_id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

function FreelancerFavCard({ user, profile, isDark, onRemove }) {
  if (!user) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 16, padding: '18px 20px',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, textDecoration: 'none', minWidth: 0 }}>
        <Avatar src={user.avatar_url} name={user.full_name} size={52} online />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user.full_name}
          </div>
          {profile?.title && (
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: 4 }}>
              {profile.title}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {profile?.rating > 0 && <Rating value={profile.rating} size={11} count={profile.reviews_count} />}
            {profile?.total_jobs > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <i className="ti ti-briefcase" style={{ marginRight: 3, fontSize: 11 }} />
                {profile.total_jobs} работ
              </span>
            )}
          </div>
        </div>
        {profile?.hourly_rate && (
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--accent-green)', flexShrink: 0 }}>
            ${Number(profile.hourly_rate).toLocaleString()}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>/ч</span>
          </div>
        )}
      </Link>
      <button
        onClick={onRemove}
        title="Убрать из избранного"
        style={{
          background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.2)',
          borderRadius: 9, padding: '7px 10px', cursor: 'pointer',
          color: '#F87171', display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
      >
        <i className="ti ti-heart-off" style={{ fontSize: 14 }} />
        Убрать
      </button>
    </div>
  )
}

function ProjectFavCard({ project, isDark, onRemove }) {
  if (!project) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {project.title}
          </h3>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Tag status={project.status || 'open'} />
          <button
            onClick={onRemove}
            title="Убрать из избранного"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 3,
              color: '#F87171', display: 'flex', alignItems: 'center',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <i className="ti ti-heart-filled" style={{ fontSize: 15 }} />
          </button>
        </div>
      </div>

      {project.description && (
        <p style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {project.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
          ${Number(project.budget_min).toLocaleString()} – ${Number(project.budget_max).toLocaleString()}
        </span>
        {project.category && <Tag color="purple">{project.category}</Tag>}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, sub, linkTo, linkLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.25 }} />
      <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        {text}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{sub}</div>
      <Link to={linkTo} style={{ textDecoration: 'none' }}>
        <button style={{
          padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
        }}>
          {linkLabel}
        </button>
      </Link>
    </div>
  )
}
