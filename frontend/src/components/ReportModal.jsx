import { useState } from 'react'
import { reportsApi } from '../api/reports'
import useToastStore from '../store/toastStore'

const REASONS = [
  { value: 'spam',                 label: 'Спам' },
  { value: 'fraud',                label: 'Мошенничество' },
  { value: 'inappropriate_content', label: 'Неуместный контент' },
  { value: 'fake_profile',         label: 'Фейковый профиль' },
  { value: 'other',                label: 'Другое' },
]

export default function ReportModal({ open, onClose, reportedUserId, projectId = null, targetName = '' }) {
  const toast = useToastStore(s => s.show)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) { toast('Укажите причину', 'error'); return }
    if (!description.trim()) { toast('Опишите проблему', 'error'); return }
    setLoading(true)
    try {
      await reportsApi.create({
        reported_user_id: reportedUserId,
        project_id: projectId || null,
        reason,
        description: description.trim(),
      })
      toast('Жалоба отправлена', 'success')
      setReason('')
      setDescription('')
      onClose()
    } catch {
      toast('Ошибка при отправке', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 20, padding: 28, width: '100%', maxWidth: 420,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(248,113,113,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-flag" style={{ fontSize: 18, color: '#F87171' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Пожаловаться
            </div>
            {targetName && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>на {targetName}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
          >
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Reason */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
              Причина
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg)', border: '0.5px solid var(--border)',
                color: reason ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 14, outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="" disabled>Выберите причину</option>
              {REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
              Описание
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите нарушение подробнее..."
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg)', border: '0.5px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'DM Sans, sans-serif',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'none', border: '0.5px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'rgba(248,113,113,0.15)', border: '0.5px solid rgba(248,113,113,0.4)',
                color: '#F87171', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Отправка...' : 'Отправить жалобу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
