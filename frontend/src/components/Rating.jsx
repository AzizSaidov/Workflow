export default function Rating({ value = 0, count, size = 13, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: size, ...style }}>
      <i className="ti ti-star-filled" style={{ color: '#EF9F27' }} />
      <span style={{ color: '#EF9F27', fontWeight: 500 }}>{Number(value).toFixed(1)}</span>
      {count !== undefined && (
        <span style={{ color: 'var(--text-muted)', fontSize: size - 1 }}>({count})</span>
      )}
    </div>
  )
}
