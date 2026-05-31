export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  iconRight,
  error,
  hint,
  disabled = false,
  style = {},
  inputStyle = {},
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <i
            className={`ti ti-${icon}`}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none',
            }}
          />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          className="input"
          style={{
            paddingLeft: icon ? 40 : 16,
            paddingRight: iconRight ? 40 : 16,
            opacity: disabled ? 0.5 : 1,
            borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
            ...inputStyle,
          }}
          {...props}
        />
        {iconRight && (
          <i
            className={`ti ti-${iconRight}`}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none',
            }}
          />
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: '#F87171' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}
