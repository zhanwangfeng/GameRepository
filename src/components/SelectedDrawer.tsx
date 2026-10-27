import type { Game } from '../types'
import { gameImage } from '../api'

export function SelectedDrawer({
  open,
  games,
  totalSize,
  onClose,
  onRemove,
  onClear,
  onSubmit,
  canSubmit,
  onHistory,
}: {
  open: boolean
  games: Game[]
  totalSize: number
  onClose: () => void
  onRemove: (aid: string) => void
  onClear: () => void
  onSubmit: () => void
  canSubmit: boolean
  onHistory: () => void
}) {
  return (
    <>
      {open && <div className="mask" onClick={onClose} />}
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          已选游戏（{games.length}）
          <span style={{ cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="drawer-body">
          {games.map((g) => (
            <div className="sel-item" key={g.aid}>
              <img
                src={gameImage(g)}
                alt=""
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
              <div className="nm">{g.title}</div>
              <div className="sz">{g.gamesize}G</div>
              <div className="x" onClick={() => onRemove(g.aid)}>
                ✕
              </div>
            </div>
          ))}
          {games.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>
              还没有选择游戏
            </div>
          )}
        </div>
        <div className="drawer-foot">
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}
          >
            <span>合计</span>
            <b>{totalSize.toFixed(1)}G</b>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClear}>
              清空
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onHistory}>
              历史
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              提交订单
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
