import { useState, useEffect } from 'react'

export type SortMode = 'none' | 'asc' | 'desc'

export function FilterBar({
  tagOptions,
  selectedTags,
  onToggleTag,
  sort,
  onCycleSort,
  capMin,
  capMax,
  onCapChange,
  viewMode,
  onViewMode,
}: {
  tagOptions: string[]
  selectedTags: string[]
  onToggleTag: (t: string) => void
  sort: SortMode
  onCycleSort: () => void
  capMin: number | null
  capMax: number | null
  onCapChange: (min: number | null, max: number | null) => void
  viewMode: 'icon' | 'list'
  onViewMode: (m: 'icon' | 'list') => void
}) {
  const [expanded, setExpanded] = useState(false)
  const COLLAPSE_AT = 12
  const canCollapse = tagOptions.length > COLLAPSE_AT
  const shownTags =
    expanded || !canCollapse ? tagOptions : tagOptions.slice(0, COLLAPSE_AT)

  // 容量区间输入框用本地字符串态，便于输入空值与中途编辑
  const [minStr, setMinStr] = useState(capMin == null ? '' : String(capMin))
  const [maxStr, setMaxStr] = useState(capMax == null ? '' : String(capMax))
  useEffect(() => {
    setMinStr(capMin == null ? '' : String(capMin))
  }, [capMin])
  useEffect(() => {
    setMaxStr(capMax == null ? '' : String(capMax))
  }, [capMax])

  const parseCap = (s: string): number | null => {
    if (s === '') return null
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }
  const handleMin = (s: string) => {
    setMinStr(s)
    onCapChange(parseCap(s), parseCap(maxStr))
  }
  const handleMax = (s: string) => {
    setMaxStr(s)
    onCapChange(parseCap(minStr), parseCap(s))
  }

  const sortLabel =
    sort === 'asc' ? '容量：小→大' : sort === 'desc' ? '容量：大→小' : '容量：默认'

  return (
    <div className="filter-bar">
      {tagOptions.length > 0 && (
        <div className="filter-row">
          <div className="filter-label">
            标签
            {selectedTags.length > 0 && (
              <span className="filter-count">已选 {selectedTags.length}</span>
            )}
          </div>
          <div className="filter-tags">
            {shownTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-pill ${selectedTags.includes(t) ? 'active' : ''}`}
                onClick={() => onToggleTag(t)}
              >
                {t}
              </button>
            ))}
            {canCollapse && (
              <button
                type="button"
                className="filter-more"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? '收起 ▲' : `展开 ▼`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="filter-row">
        <div className="filter-label">排序</div>
        <button
          type="button"
          className={`sort-btn ${sort !== 'none' ? 'active' : ''}`}
          onClick={onCycleSort}
        >
          {sortLabel}
        </button>
      </div>

      <div className="filter-row">
        <div className="filter-label">容量</div>
        <div className="cap-range">
          <input
            className="cap-input"
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="最小G"
            value={minStr}
            onChange={(e) => handleMin(e.target.value)}
          />
          <span>~</span>
          <input
            className="cap-input"
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="最大G"
            value={maxStr}
            onChange={(e) => handleMax(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-label">查看</div>
        <button
          type="button"
          className="sort-btn"
          onClick={() => onViewMode(viewMode === 'icon' ? 'list' : 'icon')}
        >
          {viewMode === 'icon' ? '图标' : '列表'}
        </button>
      </div>
    </div>
  )
}
