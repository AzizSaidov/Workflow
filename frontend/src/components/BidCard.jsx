import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import Rating from './Rating'
import Tag from './Tag'
import Button from './Button'
import { bidsApi } from '../api/bids'

const STATUS_LABEL = {
  pending: { label: 'На рассмотрении', color: 'amber' },
  accepted: { label: 'Принята', color: 'green' },
  rejected: { label: 'Отклонена', color: 'red' },
}

export default function BidCard({ bid, isOwner = false, onAccepted }) {
  const [loading, setLoading] = useState(null)
  const { id, freelancer_name, freelancer_id, freelancer_avatar, price, cover_letter, status, rating, reviews_count } = bid
  const st = STATUS_LABEL[status] || STATUS_LABEL.pending

  const handle = async (action) => {
    setLoading(action)
    try {
      if (action === 'accept') await bidsApi.accept(id)
      else await bidsApi.reject(id)
      onAccepted?.()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link to={`/profile/${freelancer_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Avatar src={freelancer_avatar} name={freelancer_name} size={40} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{freelancer_name}</div>
            {rating > 0 && <Rating value={rating} count={reviews_count} size={12} />}
          </div>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
            ${Number(price).toLocaleString()}
          </span>
          <Tag color={st.color}>{st.label}</Tag>
        </div>
      </div>

      {cover_letter && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
          {cover_letter}
        </p>
      )}

      {isOwner && status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="green" size="sm" icon="check" loading={loading === 'accept'} onClick={() => handle('accept')}>
            Принять
          </Button>
          <Button variant="danger" size="sm" icon="x" loading={loading === 'reject'} onClick={() => handle('reject')}>
            Отклонить
          </Button>
        </div>
      )}
      {isOwner && status === 'accepted' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, background: 'rgba(29,158,117,0.08)', border: '0.5px solid rgba(29,158,117,0.25)' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 15, color: 'var(--accent-green)' }} />
          <span style={{ fontSize: 12, color: 'var(--accent-teal)', fontWeight: 500 }}>
            Заявка принята — запустите проект через эскроу выше
          </span>
        </div>
      )}
    </div>
  )
}
