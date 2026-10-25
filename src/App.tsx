import { useState, useEffect, useCallback, useRef } from 'react'
import type { Game, InitData, HistoryRecord } from './types'
import { fetchInit, fetchGames, submit, getPlatform } from './api'
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
  const [keyword, setKeyword] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<Game[]>([])
  const [inDiskId, setInDiskId] = useState<number | null>(null)
  const [outDiskId, setOutDiskId] = useState<number | null>(null)

  const [selOpen, setSelOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [toast, setToast] = useState('')
  const { records, save, del } = useHistory()

  const reqId = useRef(0)

  useEffect(() => {
    fetchInit().then(setInit)
  }, [])

  const load = useCallback(async (kw: string, t: string, p: number, append: boolean) => {
    setLoading(true)
    const my = ++reqId.current
    const res = await fetchGames({ keywords: kw, page: p, tid: '' })
    if (my !== reqId.current) return
    setGames((prev) => (append ? [...prev, ...res.data] : res.data))
    setLastPage(res.last_page)
    setPage(p)
    setLoading(false)
  }, [])

  // 关键词（防抖）变化 → 重置并加载第 1 页
  useEffect(() => {
    const t = setTimeout(() => load(keyword, '', 1, false), 300)
    return () => clearTimeout(t)
  }, [keyword, load])

  const loadMore = () => {
    if (loading || page >= lastPage) return
    load(keyword, '', page + 1, true)
  }

  const toggle = (g: Game) => {
    setSelected((prev) =>
      prev.some((x) => x.aid === g.aid)
        ? prev.filter((x) => x.aid !== g.aid)
        : [...prev, g],
    )
  }

  const selectedIds = selected.map((g) => g.aid)
  const selectedSize = selected.reduce((s, g) => s + (parseFloat(g.gamesize) || 0), 0)
  const diskCap =
    (init?.hard_disk.find((d) => d.id === inDiskId)?.capacity || 0) +
    (init?.attach_hard_disk.find((d) => d.id === outDiskId)?.capacity || 0)
  const remaining = diskCap - selectedSize
  const canSubmit = selected.length > 0 && diskCap > 0 && remaining >= 0

  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 1800)
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
            onIn={setInDiskId}
            onOut={setOutDiskId}
          />
          <CapacityBar
            selectedCount={selected.length}
            selectedSize={selectedSize}
            diskCap={diskCap}
            remaining={remaining}
          />
          <GameGrid
            games={games}
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
        keyword={keyword}
        onSearch={setKeyword}
        onHistory={() => setHistOpen(true)}
        onView={() => setSelOpen(true)}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
