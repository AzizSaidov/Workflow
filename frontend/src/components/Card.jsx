export default function Card({ children, style = {}, className = '', onClick, noPad = false }) {
  return (
    <div
      className={`card ${className}`}
      style={{ padding: noPad ? 0 : undefined, cursor: onClick ? 'pointer' : undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
