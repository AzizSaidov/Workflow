const STATUS_MAP = {
  open:        'green',
  in_progress: 'amber',
  delivered:   'purple',
  completed:   'green',
  disputed:    'red',
  cancelled:   'muted',
}

const STATUS_LABELS = {
  open:        'Открыт',
  in_progress: 'В работе',
  delivered:   'Сдан',
  completed:   'Завершён',
  disputed:    'Спор',
  cancelled:   'Отменён',
}

export default function Tag({ children, color = 'purple', status, style = {} }) {
  const resolvedColor = status ? STATUS_MAP[status] : color
  const label = status ? STATUS_LABELS[status] : children
  return (
    <span className={`tag tag-${resolvedColor}`} style={style}>
      {label}
    </span>
  )
}
