import useThemeStore from '../store/themeStore'

export default function ThemeToggle({ style = {} }) {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '9px 18px',
        borderRadius: 40,
        border: isDark
          ? '0.5px solid rgba(255,255,255,0.12)'
          : '0.5px solid rgba(64,56,178,0.25)',
        background: isDark
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(64,56,178,0.08)',
        color: isDark ? 'rgba(255,255,255,0.65)' : '#4038B2',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      <i
        className={`ti ${isDark ? 'ti-sun' : 'ti-moon-stars'}`}
        style={{ fontSize: 15 }}
      />
      {isDark ? 'Светлая' : 'Тёмная'}
    </button>
  )
}
