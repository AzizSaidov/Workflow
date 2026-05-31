export default function Avatar({ src, name, size = 44, online = false, style = {} }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover', display: 'block',
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'rgba(127,119,221,0.15)',
          color: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: Math.round(size * 0.32),
          flexShrink: 0,
        }}>
          {initials}
        </div>
      )}
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: Math.round(size * 0.22), height: Math.round(size * 0.22),
          borderRadius: '50%',
          background: '#1D9E75',
          border: '2px solid var(--bg)',
        }} />
      )}
    </div>
  )
}
