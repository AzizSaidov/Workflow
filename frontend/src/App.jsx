import useThemeStore from './store/themeStore'
import StarBackground from './components/StarBackground'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const { isDark } = useThemeStore()

  return (
    <div className="page-wrapper">
      <StarBackground isDark={isDark} intensity="full" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <ThemeToggle />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 20,
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: '-2px',
            color: 'var(--text-primary)',
          }}>
            work<span style={{ color: 'var(--accent)' }}>flow</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            Stage 1 — Foundation ✓
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary">Начать</button>
            <button className="btn btn-outline">Войти</button>
            <button className="btn btn-green">Зелёный</button>
            <button className="btn btn-danger">Опасность</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="tag tag-purple">Разработка</span>
            <span className="tag tag-green">Открыт</span>
            <span className="tag tag-amber">В работе</span>
            <span className="tag tag-red">Спор</span>
          </div>
        </div>
      </div>
    </div>
  )
}
