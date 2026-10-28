export function CapacityBar({
  selectedCount,
  selectedSize,
  diskCap,
  remaining,
  cornerLabel,
}: {
  selectedCount: number
  selectedSize: number
  diskCap: number
  remaining: number
  /** 可选：卡片左上角的小标签文案（如平台名），不传则不渲染 */
  cornerLabel?: string
}) {
  const ratio = diskCap > 0 ? Math.min(1, selectedSize / diskCap) : 0
  const color =
    remaining < 0 ? 'var(--danger)' : ratio > 0.85 ? 'var(--warn)' : 'var(--ok)'
  return (
    <div className="section">
      {cornerLabel && <span className="cap-badge platform-badge">{cornerLabel}</span>}
      <div className="cap-card">
        <div className="cap-grid">
          <div className="cap-item">
            <div className="v">{selectedCount}</div>
            <div className="l">已选游戏</div>
          </div>
          <div className="cap-item">
            <div className="v">{selectedSize.toFixed(1)}G</div>
            <div className="l">已选容量</div>
          </div>
          <div className="cap-item">
            <div className="v">{diskCap > 0 ? diskCap + 'G' : '—'}</div>
            <div className="l">硬盘容量</div>
          </div>
          <div className="cap-item">
            <div
              className="v"
              style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--text)' }}
            >
              {diskCap > 0 ? remaining.toFixed(1) + 'G' : '—'}
            </div>
            <div className="l">剩余</div>
          </div>
        </div>
        <div className="cap-bar">
          <i style={{ width: ratio * 100 + '%', background: color }} />
        </div>
        {remaining < 0 && (
          <div className="cap-warn">
            容量不足，已超出 {(-remaining).toFixed(1)}G，请减少游戏或更换硬盘
          </div>
        )}
        {diskCap === 0 && (
          <div className="cap-warn">请先选择内置或外置硬盘容量</div>
        )}
      </div>
    </div>
  )
}
