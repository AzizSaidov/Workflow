export default function Select({ label, value, onChange, options = [], placeholder, error, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          className="input"
          style={{
            appearance: 'none',
            paddingRight: 36,
            cursor: 'pointer',
            borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <i
          className="ti ti-chevron-down"
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none',
          }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: '#F87171' }}>{error}</span>}
    </div>
  )
}
