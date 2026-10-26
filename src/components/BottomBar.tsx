import { useState } from 'react'
import { FilterBar, type SortMode } from './FilterBar'

function SearchDialog({
  keyword,
  onSearch,
  onClose,
  onRefresh,
  tagOptions,
  selectedTags,
  onToggleTag,
  onClearTags,
  sort,
  onCycleSort,
  capMin,
  capMax,
  onCapChange,
}: {
  keyword: string
  onSearch: (v: string) => void
  onClose: () => void
  onRefresh: () => void
  tagOptions: string[]
  selectedTags: string[]
  onToggleTag: (t: string) => void
  onClearTags: () => void
  sort: SortMode
  onCycleSort: () => void
  capMin: number | null
  capMax: number | null
  onCapChange: (min: number | null, max: number | null) => void
}) {
  // 确认 / 点击遮罩关闭：先刷新一次，再关闭
  const handleClose = () => {
    onRefresh()
    onClose()
  }
  return (
    <div className="search-mask" onClick={handleClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <input
          className="search-input"
          autoFocus
          value={keyword}
          placeholder="输入游戏名称搜索"
          // 输入变更立即生效（App 内已做防抖）
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleClose()
          }}
        />
        <FilterBar
          tagOptions={tagOptions}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
          sort={sort}
          onCycleSort={onCycleSort}
          capMin={capMin}
          capMax={capMax}
          onCapChange={onCapChange}
        />
        <div className="search-btns">
          <button
            className="btn btn-ghost"
            onClick={() => {
              // 清空：关键字 + 标签 + 容量区间 一并重置
              onSearch('')
              onClearTags()
              onCapChange(null, null)
            }}
          >
            清空
          </button>
          <button className="btn btn-primary" onClick={handleClose}>
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
  diskCap,
  keyword,
  onSearch,
  onHistory,
  onView,
  tagOptions,
  selectedTags,
  onToggleTag,
  onClearTags,
  sort,
  onCycleSort,
  capMin,
  capMax,
  onCapChange,
  onRefresh,
}: {
  selectedCount: number
  selectedSize: number
  remaining: number
  diskCap: number
  keyword: string
  onSearch: (v: string) => void
  onHistory: () => void
  onView: () => void
  tagOptions: string[]
  selectedTags: string[]
  onToggleTag: (t: string) => void
  onClearTags: () => void
  sort: SortMode
  onCycleSort: () => void
  capMin: number | null
  capMax: number | null
  onCapChange: (min: number | null, max: number | null) => void
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const capRatio = diskCap > 0 ? Math.min(1, selectedSize / diskCap) : 0
  const capColor =
    remaining < 0 ? 'var(--danger)' : capRatio > 0.85 ? 'var(--warn)' : 'var(--ok)'
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
        <div className="cap-bar" title={`已用 ${selectedSize.toFixed(1)}G / 共 ${diskCap.toFixed(1)}G`}>
          <div
            className="cap-bar-fill"
            style={{
              width: `${diskCap > 0 ? Math.min(100, capRatio * 100) : 0}%`,
              background: capColor,
            }}
          />
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
          keyword={keyword}
          onSearch={onSearch}
          onClose={() => setOpen(false)}
          onRefresh={onRefresh}
          tagOptions={tagOptions}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
          sort={sort}
          onCycleSort={onCycleSort}
          capMin={capMin}
          capMax={capMax}
          onCapChange={onCapChange}
        />
      )}
    </div>
  )
}
