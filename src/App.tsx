import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Game, InitData, HistoryRecord } from './types'
import { fetchInit, fetchGames, fetchTagOptions, submit, getPlatform } from './api'
import { Header } from './components/Header'
import { DiskSelector } from './components/DiskSelector'
import { CapacityBar } from './components/CapacityBar'
import { GameGrid } from './components/GameGrid'
import { BottomBar } from './components/BottomBar'
import { SelectedDrawer } from './components/SelectedDrawer'
import { SubmitDialog } from './components/SubmitDialog'
import { HistoryDrawer } from './components/HistoryDrawer'
import { AdSlot } from './components/AdSlot'
import { useHistory } from './hooks/useHistory'

// 展示窗口大小：从“筛选后队列”头部取一段展示，超出部分由“加载更多”逐步揭示
const PAGE = 24

export default function App() {
  const platform = getPlatform()
  useEffect(() => {
    document.title = `${platform} 游戏选装`
  }, [platform])
  const [init, setInit] = useState<InitData | null>(null)
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  // 已加载的全部游戏（首次进入时一次性从服务端拉取的全量集合，多页已合并）
  const [allGames, setAllGames] = useState<Game[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE)
  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<Game[]>([])
  const [inDiskId, setInDiskId] = useState<number | null>(null)
  const [outDiskId, setOutDiskId] = useState<number | null>(null)

  const [tags, setTags] = useState<string[]>([])
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none')
  const [capMin, setCapMin] = useState<number | null>(null)
  const [capMax, setCapMax] = useState<number | null>(null)

  const [selOpen, setSelOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [showTop, setShowTop] = useState(false)
  // 游戏列表展示模式：icon=图标(卡片网格) / list=列表(一行一个，图左文右)
  const [viewMode, setViewMode] = useState<'icon' | 'list'>('list')
  const { records, save, del } = useHistory()

  const reqId = useRef(0)

  // 一次性拉取全量游戏（并行请求所有分页，不带任何筛选条件）。之后关键词/标签/容量/排序
  // 全部在客户端对这份完整集合进行，不再请求服务端，避免“默认顺序→指定排序”的闪烁。
  const loadAll = useCallback(async () => {
    setLoading(true)
    const my = ++reqId.current
    try {
      const first = await fetchGames({ keywords: '', page: 1, tid: '', tags: [] })
      if (my !== reqId.current) return
      let all = [...first.data]
      const last = Math.max(1, first.last_page || 1)
      if (last > 1) {
        const rest = await Promise.all(
          Array.from({ length: last - 1 }, (_, i) =>
            fetchGames({ keywords: '', page: i + 2, tid: '', tags: [] }),
          ),
        )
        if (my !== reqId.current) return
        for (const r of rest) if (r?.data?.length) all = all.concat(r.data)
      }
      if (my !== reqId.current) return
      // 彻底卸载旧数据：用全新集合整体替换。
      // 注意：服务端分页可能把同一游戏重复返回（相同 aid 出现在多页），
      // 若不按 aid 去重，GameGrid 用 key={g.aid} 渲染时会产生 key 冲突，
      // 导致首个同 aid 的卡片被错误复用/冻结（不再响应筛选排序，且 onClick
      // 闭包停留在挂载时的旧 inDiskId===null 状态，点一下就误报“请选择内置硬盘”）。
      const seen = new Set<string>()
      const unique: Game[] = []
      for (const g of all) {
        if (!g.aid || seen.has(g.aid)) continue
        seen.add(g.aid)
        unique.push(g)
      }
      setAllGames(unique)
      setDisplayCount(PAGE)
    } finally {
      if (my === reqId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInit().then(setInit)
    fetchTagOptions().then(setTagOptions)
    // 进入即拉取全量游戏；后续所有筛选/排序均为纯前端
    loadAll()
  }, [loadAll])

  // 滚动监听：下滑超过一屏高度时显示“回到顶部”按钮
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 关键词 / 标签 / 容量区间 / 排序 变化（全部为客户端对完整集合的筛选与排序，无需重新请求）：回到队列头部
  useEffect(() => {
    setDisplayCount(PAGE)
  }, [keyword, tags, capMin, capMax, sort])

  // 加载更多：仅从已筛选排序的队列中向尾部揭示更多，不再请求服务端、不再重排已显示项
  const loadMore = () => {
    setDisplayCount((c) => Math.min(c + PAGE, queue.length))
  }

  // 选择/取消游戏：取消始终允许；新增时若会使剩余容量为负则拒绝并提示
  const toggle = (g: Game) => {
    if (selected.some((x) => x.aid === g.aid)) {
      setSelected((prev) => prev.filter((x) => x.aid !== g.aid))
      return
    }
    const size = parseFloat(g.gamesize) || 0
    if (inDiskId === null) {
      showToast('请先选择内置硬盘')
      return
    }
    if (size - remaining > 0.05) {
      showToast(`容量不足，该游戏还差 ${(size - remaining).toFixed(1)}G，无法添加`)
      return
    }
    setSelected((prev) => [...prev, g])
  }

  // 更换/取消硬盘：若变更后剩余容量为负则拒绝并提示（nextIn/nextOut 为变更后的目标）
  const changeDisk = (nextIn: number | null, nextOut: number | null) => {
    if (nextOut !== null && nextIn === null) {
      showToast('请先选择内置硬盘')
      return
    }
    const nextCap =
      (init?.hard_disk.find((d) => d.id === nextIn)?.capacity || 0) +
      (init?.attach_hard_disk.find((d) => d.id === nextOut)?.capacity || 0)
    if (nextCap - selectedSize < -0.05) {
      showToast(`变更后容量不够，请先取消部分游戏`)
      return
    }
    setInDiskId(nextIn)
    setOutDiskId(nextOut)
  }

  const selectedIds = selected.map((g) => g.aid)
  const selectedSize = selected.reduce((s, g) => s + (parseFloat(g.gamesize) || 0), 0)
  const diskCap =
    (init?.hard_disk.find((d) => d.id === inDiskId)?.capacity || 0) +
    (init?.attach_hard_disk.find((d) => d.id === outDiskId)?.capacity || 0)
  const remaining = diskCap - selectedSize
  const canSubmit = selected.length > 0 && diskCap > 0 && remaining >= 0

  // 关键词（标题包含，忽略大小写）/ 标签（AND，须同时包含所有选中标签）/ 容量区间筛选 + 容量排序：
  // 作用在“已加载的全部游戏”上，得到稳定、统一的筛选后队列。
  const queue = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    let list = allGames.filter((g) => {
      if (kw && !g.title.toLowerCase().includes(kw)) return false
      if (tags.length && !tags.every((t) => (g.tags || []).includes(t))) return false
      return true
    })
    const lo = capMin != null && !isNaN(capMin) ? capMin : null
    const hi = capMax != null && !isNaN(capMax) ? capMax : null
    const rangeInvalid = lo != null && hi != null && lo > hi
    if (!rangeInvalid && (lo != null || hi != null)) {
      list = list.filter((g) => {
        const s = parseFloat(g.gamesize) || 0
        if (lo != null && s < lo - 1e-6) return false
        if (hi != null && s > hi + 1e-6) return false
        return true
      })
    }
    if (sort !== 'none') {
      list = [...list].sort((a, b) => {
        const sa = parseFloat(a.gamesize) || 0
        const sb = parseFloat(b.gamesize) || 0
        return sort === 'asc' ? sa - sb : sb - sa
      })
    }
    return list
  }, [allGames, keyword, tags, capMin, capMax, sort])

  // 仅展示筛选后队列头部的部分数据
  const displayGames = useMemo(() => queue.slice(0, displayCount), [queue, displayCount])
  const hasMore = displayCount < queue.length

  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3600)
  }

  const doSubmit = async (form: { phone: string; fullname: string }) => {
    const res = await submit({
      phone: form.phone,
      fullname: form.fullname,
      game: selectedIds.join(','),
      c_id: inDiskId,
      c_id1: outDiskId,
    })
    if (res.status) {
      const record: HistoryRecord = {
        form: { phone: form.phone, fullname: form.fullname, inDiskId, outDiskId },
        selected,
        createDate: new Date().toLocaleString('zh-CN'),
        timeStamp: Date.now(),
        submitted: true,
      }
      save(record)
      setSelected([])
      setInDiskId(null)
      setOutDiskId(null)
      setSubmitOpen(false)
      setSelOpen(false)
      showToast('提交成功，商家将尽快与您联系')
    } else {
      showToast('提交失败：' + res.msg)
    }
  }

  const restore = (r: HistoryRecord) => {
    setSelected(r.selected)
    setInDiskId(r.form.inDiskId)
    setOutDiskId(r.form.outDiskId)
    setHistOpen(false)
    showToast('已恢复该清单')
  }

  // 广告 slot 来自 .env：VITE_AD_SLOT_TOP / VITE_AD_SLOT_LEFT / VITE_AD_SLOT_RIGHT
  // （左右位未配置则不渲染）；发布者 ID 由 VITE_ADSENSE_CLIENT 控制（见 adsense.ts）。
  const adSlotTop = ((import.meta.env as any).VITE_AD_SLOT_TOP as string | undefined) ?? '1214720725'
  const adSlotLeft = (import.meta.env as any).VITE_AD_SLOT_LEFT as string | undefined
  const adSlotRight = (import.meta.env as any).VITE_AD_SLOT_RIGHT as string | undefined

  return (
    <div>
      <AdSlot slot={adSlotTop} />
      {/* 左右两侧固定广告栏：slot 来自 .env，仅 PC 端显示、移动端隐藏（见 index.css .ad-sidebar） */}
      {adSlotLeft && (
        <AdSlot slot={adSlotLeft} format="vertical" className="ad-sidebar ad-left" />
      )}
      {adSlotRight && (
        <AdSlot slot={adSlotRight} format="vertical" className="ad-sidebar ad-right" />
      )}
      <Header platform={platform} />
      {init && (
        <>
          <DiskSelector
            builtIn={init.hard_disk}
            external={init.attach_hard_disk}
            inDiskId={inDiskId}
            outDiskId={outDiskId}
            onIn={(id) => changeDisk(id, outDiskId)}
            onOut={(id) => changeDisk(inDiskId, id)}
            onBuiltInCancel={() => showToast('内置硬盘不可取消，请选择其他容量')}
          />
          <CapacityBar
            selectedCount={selected.length}
            selectedSize={selectedSize}
            diskCap={diskCap}
            remaining={remaining}
          />
          <GameGrid
            games={displayGames}
            selectedIds={selectedIds}
            onToggle={toggle}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            viewMode={viewMode}
          />
        </>
      )}

      <BottomBar
        selectedCount={selected.length}
        selectedSize={selectedSize}
        remaining={remaining}
        diskCap={diskCap}
        keyword={keyword}
        onSearch={setKeyword}
        onView={() => setSelOpen(true)}
        tagOptions={tagOptions}
        selectedTags={tags}
        onToggleTag={(t) =>
          setTags((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
          )
        }
        onClearTags={() => setTags([])}
        sort={sort}
        onCycleSort={() =>
          setSort((s) => (s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none'))
        }
        capMin={capMin}
        capMax={capMax}
        onCapChange={(min, max) => {
          setCapMin(min)
          setCapMax(max)
        }}
        onRefresh={() => loadAll()}
        viewMode={viewMode}
        onViewMode={setViewMode}
        platform={platform}
      />

      <SelectedDrawer
        open={selOpen}
        games={selected}
        totalSize={selectedSize}
        onClose={() => setSelOpen(false)}
        onRemove={(aid) => setSelected((prev) => prev.filter((g) => g.aid !== aid))}
        onClear={() => setSelected([])}
        onSubmit={() => setSubmitOpen(true)}
        canSubmit={canSubmit}
        onHistory={() => setHistOpen(true)}
      />

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmit={doSubmit}
      />

      <HistoryDrawer
        open={histOpen}
        records={records}
        onClose={() => setHistOpen(false)}
        onRestore={restore}
        onDelete={del}
      />

      {showTop && (
        <button
          className="back-top"
          aria-label="回到顶部"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
