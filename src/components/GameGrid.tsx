import { useEffect, useRef, useState } from 'react'
import type { Game } from '../types'
import { gameImage } from '../api'

function GameCard({
  game,
  selected,
  onToggle,
}: {
  game: Game
  selected: boolean
  onToggle: () => void
}) {
  const [err, setErr] = useState(false)
  return (
    <div className={`card ${selected ? 'selected' : ''}`} onClick={onToggle}>
      {selected && (
        <div className="sel-mask">
          <span className="sel-check">✓</span>
        </div>
      )}
      <div className="thumb">
        {!err ? (
          <img
            className="thumb-img"
            src={gameImage(game)}
            alt={game.title}
            loading="lazy"
            onError={() => setErr(true)}
          />
        ) : (
          <div className="thumb-fallback">{game.title}</div>
        )}
      </div>
      <div className="info">
        <div className="name">{game.title}</div>
        <div className="meta">
          <span className="tag">{game.gamesize}G</span>
          <span>{game.language}</span>
        </div>
        <div className="card-tags">
          {(game.tags || []).slice(0, 3).map((t) => (
            <span className="ct" key={t}>{t}</span>
          ))}
          {(game.tags || []).length > 3 && (
            <span className="ct ct-more">+{(game.tags || []).length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function GameGrid({
  games,
  selectedIds,
  onToggle,
  onLoadMore,
  hasMore,
  loading,
}: {
  games: Game[]
  selectedIds: string[]
  onToggle: (g: Game) => void
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  // 监听底部哨兵元素：进入视口（提前 200px）即视为需要加载
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => setShown(entries[0].isIntersecting),
      { rootMargin: '200px' },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

  // 当哨兵可见、还有更多、且当前未在加载时，自动加载下一页
  // loading 回到 false 后若仍可见则继续累加（连续滚动自动加载）
  useEffect(() => {
    if (shown && hasMore && !loading) onLoadMore()
  }, [shown, hasMore, loading, onLoadMore])

  return (
    <>
      <div className="grid">
        {games.map((g) => (
          <GameCard
            key={g.aid}
            game={g}
            selected={selectedIds.includes(g.aid)}
            onToggle={() => onToggle(g)}
          />
        ))}
      </div>
      <div className="loadmore">
        {loading ? (
          <div className="spinner" />
        ) : hasMore ? (
          '上拉加载更多'
        ) : (
          '没有更多了'
        )}
        <div ref={sentinelRef} />
      </div>
    </>
  )
}
