import type { HistoryRecord } from '../types'

export function HistoryDrawer({
  open,
  records,
  onClose,
  onRestore,
  onDelete,
}: {
  open: boolean
  records: HistoryRecord[]
  onClose: () => void
  onRestore: (r: HistoryRecord) => void
  onDelete: (ts: number) => void
}) {
  return (
    <>
      {open && <div className="mask" onClick={onClose} />}
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          提交历史
          <span style={{ cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="drawer-body">
          {records.map((r) => (
            <div
              key={r.timeStamp}
              style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{r.form.fullname}</b>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.createDate}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                手机 {r.form.phone} · {r.selected.length} 款 ·{' '}
                {r.selected.reduce((s, g) => s + (parseFloat(g.gamesize) || 0), 0).toFixed(1)}G
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                <span
                  style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: 13 }}
                  onClick={() => onRestore(r)}
                >
                  恢复
                </span>
                <span
                  style={{ cursor: 'pointer', color: 'var(--danger)', fontSize: 13 }}
                  onClick={() => onDelete(r.timeStamp)}
                >
                  删除
                </span>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>
              暂无历史记录
            </div>
          )}
        </div>
      </div>
    </>
  )
}
