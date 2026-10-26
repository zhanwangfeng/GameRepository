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

export default function App() {
  const platform = getPlatform()
  useEffect(() => {
    document.title = `${platform} 游戏选装`
  }, [platform])
  const [init, setInit] = useState<InitData | null>(null)
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
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
  const { records, save, del } = useHistory()

  const reqId = useRef(0)

  useEffect(() => {
    fetchInit().then(setInit)
    fetchTagOptions().then(setTagOptions)
  }, [])

  const load = useCallback(async (kw: string, tagsArr: string[], p: number, append: boolean) => {
    setLoading(true)
    const my = ++reqId.current
    const res = await fetchGames({ keywords: kw, page: p, tid: '', tags: tagsArr })
    if (my !== reqId.current) return
    setGames((prev) => (append ? [...prev, ...res.data] : res.data))
    setLastPage(res.last_page)
    setPage(p)
    setLoading(false)
  }, [])

  // 关键词、标签筛选（防抖）变化 → 重置并加载第 1 页；两者独立、可同时生效
  useEffect(() => {
    const t = setTimeout(() => load(keyword, tags, 1, false), 300)
    return () => clearTimeout(t)
  }, [keyword, tags, load])

  // 滚动监听：下滑超过一屏高度时显示"回到顶部"按钮
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loadMore = () => {
    if (loading || page >= lastPage) return
    load(keyword, tags, page + 1, true)
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

  // 容量区间筛选 + 容量排序：作用在已加载列表上（客户端），不重新请求；
  // 关键字/标签仍走服务端筛选，二者在此合并生效。
  // 区间不合法（min>max 或某端为 NaN）时视为无效，显示全部游戏。
  const visibleGames = useMemo(() => {
    let list = games
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
  }, [games, capMin, capMax, sort])

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

  return (
    <div>
      <AdSlot slot="1214720725" />
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
            games={visibleGames}
            selectedIds={selectedIds}
            onToggle={toggle}
            onLoadMore={loadMore}
            hasMore={page < lastPage}
            loading={loading}
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
        onHistory={() => setHistOpen(true)}
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
        onRefresh={() => load(keyword, tags, 1, false)}
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

      <div className="platform-badge">{platform}</div>

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
