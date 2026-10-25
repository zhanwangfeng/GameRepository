import { useState } from 'react'

function SearchDialog({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: string
  onConfirm: (v: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  return (
    <div className="search-mask" onClick={onCancel}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <input
          className="search-input"
          autoFocus
          value={draft}
          placeholder="输入游戏名称搜索"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(draft)
          }}
        />
        <div className="search-btns">
          <button className="btn btn-ghost" onClick={() => setDraft('')}>
            清空
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(draft)}>
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

export function BottomBar({
  selectedCount,
  selectedSize,
  remaining,
  keyword,
  onSearch,
  onHistory,
  onView,
}: {
  selectedCount: number
  selectedSize: number
  remaining: number
  keyword: string
  onSearch: (v: string) => void
  onHistory: () => void
  onView: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bottom-bar">
      <div
        className="summary"
        onClick={onView}
        title="点击查看已选"
        role="button"
      >
        <div className="s-line1">
          <b>{selectedCount}</b>款 · <b>{selectedSize.toFixed(1)}G</b>
        </div>
        <div
          className="s-line2"
          style={remaining < 0 ? { color: 'var(--danger)' } : undefined}
        >
          （剩余 {remaining.toFixed(1)}G）
        </div>
        <span className="s-chevron">›</span>
      </div>
      <div className="search-trigger" onClick={() => setOpen(true)}>
        <span className="bb-ico">🔍</span>
        <span className="bb-preview">{keyword || '搜索游戏'}</span>
      </div>
      <div className="bb-actions">
        <button className="btn btn-ghost" onClick={onHistory}>
          历史
        </button>
        <button className="btn btn-primary" onClick={onView}>
          提交
        </button>
      </div>

      {open && (
        <SearchDialog
          initial={keyword}
          onConfirm={(v) => {
            onSearch(v)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
