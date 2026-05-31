import useThemeStore from '../store/themeStore'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '8px 16px',
        borderRadius: '40px',
        border: isDark
          ? '0.5px solid rgba(255,255,255,0.12)'
          : '0.5px solid rgba(80,70,200,0.2)',
        background: isDark
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(80,70,200,0.09)',
        color: isDark ? 'rgba(255,255,255,0.6)' : '#4038B2',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
    >
      <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: '15px' }} />
      {isDark ? 'Светлая' : 'Тёмная'}
    </button>
  )
}
