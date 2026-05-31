export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style = {},
  className = '',
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ opacity: disabled ? 0.5 : 1, ...style }}
    >
      {loading ? (
        <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
      ) : icon ? (
        <i className={`ti ti-${icon}`} />
      ) : null}
      {children}
      {iconRight && !loading && <i className={`ti ti-${iconRight}`} />}
    </button>
  )
}
