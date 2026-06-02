import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Tag from '../components/Tag'

function deadlineInfo(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  if (diff < 0) return { label: `Просрочено на ${Math.abs(diff)} дн.`, color: '#F87171' }
  if (diff === 0) return { label: 'Сегодня дедлайн', color: '#F87171' }
  if (diff <= 7) return { label: `${diff} дн. до дедлайна`, color: '#FBBF24' }
  return { label: `${diff} дн. до дедлайна`, color: 'var(--accent-green)' }
}

function Section({ title, icon, color, projects, user, isDark, empty, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 17, color }} />
        </div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '2px 10px', borderRadius: 20 }}>
          {projects.length}
        </span>
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: '28px 24px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{empty}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(p => children(p))}
        </div>
      )}
    </div>
  )
}

function WorkCard({ project, isDark, actions }) {
  const dl = deadlineInfo(project.deadline)
  const budget = Number(project.budget_max || project.budget_min || 0)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 20,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            {project.title}
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {dl && (
            <span style={{ fontSize: 12, color: dl.color, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-clock" style={{ fontSize: 12 }} />
              {dl.label}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-calendar" style={{ fontSize: 12 }} />
            {new Date(project.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Budget */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: 'var(--accent-green)' }}>
            {budget.toLocaleString()}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>бюджет</div>
      </div>

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

export default function MyWork() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.getMine()
      .then(r => {
        const mine = (r.data || []).filter(p => p.assigned_freelancer_id === user?.id)
        setProjects(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const inProgress = projects.filter(p => p.status === 'in_progress')
  const delivered = projects.filter(p => p.status === 'delivered')
  const completed = projects.filter(p => p.status === 'completed')

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 860 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)', marginBottom: 8 }}>
              Мои работы
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Все проекты в которых ты участвуешь
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 22 }}>
              <i className="ti ti-briefcase-off" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Пока нет активных работ
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                Подай заявку на понравившийся проект
              </p>
              <Link to="/projects">
                <button className="btn btn-primary">
                  <i className="ti ti-search" style={{ fontSize: 14 }} />
                  Найти проекты
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* В работе */}
              <Section title="В работе" icon="clock" color="var(--accent)" projects={inProgress} isDark={isDark}
                empty="Нет проектов в работе">
                {p => (
                  <WorkCard key={p.id} project={p} isDark={isDark} actions={
                    <>
                      <Link to={`/projects/${p.id}`}>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                          <i className="ti ti-send" style={{ fontSize: 13 }} />
                          Сдать работу
                        </button>
                      </Link>
                      <Link to={`/chats?project=${p.id}`}>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                          <i className="ti ti-message" style={{ fontSize: 13 }} />
                          Чат
                        </button>
                      </Link>
                    </>
                  } />
                )}
              </Section>

              {/* На проверке */}
              <Section title="На проверке" icon="package" color="#FBBF24" projects={delivered} isDark={isDark}
                empty="Нет работ на проверке">
                {p => (
                  <WorkCard key={p.id} project={p} isDark={isDark} actions={
                    <Link to={`/projects/${p.id}`}>
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                        <i className="ti ti-eye" style={{ fontSize: 13 }} />
                        Подробнее
                      </button>
                    </Link>
                  } />
                )}
              </Section>

              {/* Завершённые */}
              <Section title="Завершённые" icon="circle-check" color="var(--accent-green)" projects={completed} isDark={isDark}
                empty="Нет завершённых работ">
                {p => {
                  const earned = Number(p.budget_max || p.budget_min || 0) * 0.99
                  return (
                    <div key={p.id} style={{
                      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                      borderRadius: 16, padding: '20px 24px',
                      display: 'flex', alignItems: 'center', gap: 20,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.title}
                          </div>
                        </Link>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(p.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: 'var(--accent-green)' }}>
                            {earned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>получено (−1%)</div>
                      </div>
                      <Tag color="green">Завершён</Tag>
                    </div>
                  )
                }}
              </Section>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
