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
            <span className="ct" key={t}>
              {t}
            </span>
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
  // 记录哨兵上一次的可见状态，仅在其“由不可见切到可见”的瞬间触发一次加载，
  // 防止客户端瞬时加载（无服务端 loading 门控）造成的连续级联把整列一次性拉完。
  const prevIntersecting = useRef(false)
  // onLoadMore 每次渲染都是新函数，用 ref 持有最新引用，避免 observer 反复重建。
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting
        if (isIntersecting && !prevIntersecting.current) {
          onLoadMoreRef.current()
        }
        prevIntersecting.current = isIntersecting
      },
      { rootMargin: '200px' },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

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
          <span className="loadmore-btn" onClick={onLoadMore}>
            上拉加载更多
          </span>
        ) : (
          '没有更多了'
        )}
        <div ref={sentinelRef} />
      </div>
    </>
  )
}
