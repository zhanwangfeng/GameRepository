import type { InitData, GameListResponse, SubmitPayload, Game } from './types'

// 仅 localhost / 127.0.0.1 使用本地 mock；其他域名（生产）默认直连真实接口，
// 无需再手动关闭。可用 VITE_USE_MOCK=true/false 强制覆盖。
const host = location.hostname
const isLocal = host === 'localhost' || host === '127.0.0.1'
const forced = import.meta.env.VITE_USE_MOCK
const USE_MOCK = forced === 'true' || (forced !== 'false' && isLocal)

// mock 数据（位于仓库 mock/api/）
import initRaw from '../mock/api/init.json'
import gamesAll from '../mock/api/games.json'
// 本地占位封面：mock 模式下所有卡片统一使用，避免依赖远程/不存在的图片
import mockCover from './assets/mock-cover.jpg'

// 全部使用相对路径：构建包可原样部署到 /game_select_ps4/、/game_select_ps5/、
// /game_select_switch/ 等任意子目录，自动复用各自目录下的 api/ 与 game_logo/。
const API = {
  init: 'api/init.php',
  gameList: 'api/game_list.php',
  submit: 'api/submit.php',
}

// 从部署目录名识别当前平台，例如 /game_select_ps4/ → PS4
export function getPlatform(): string {
  const m = location.pathname.match(/game_select_([^/]+)/i)
  return m ? m[1].toUpperCase() : 'PS4'
}

export function gameImage(g: { litpic: string }): string {
  if (USE_MOCK) return mockCover
  if (!g.litpic) return ''
  if (g.litpic.startsWith('http')) return g.litpic
  // litpic 形如 /game_logo/1.jpg：去掉前缀斜杠按部署目录相对解析
  return g.litpic.replace(/^\/+/, '')
}

// 可选标签：根据“全部游戏”的 tags 动态统计得出，而非前端预定义。
// mock 模式从完整游戏列表聚合（按出现频次降序，常见标签靠前）；
// 真实环境交由后端 init 接口按数据动态返回（tag_list）。
export async function fetchTagOptions(): Promise<string[]> {
  if (USE_MOCK) {
    const all = gamesAll as Game[]
    const cnt: Record<string, number> = {}
    for (const g of all) for (const t of g.tags || []) cnt[t] = (cnt[t] || 0) + 1
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])
  }
  const r = await fetch(API.init, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const j = await r.json()
  return ((j.data && j.data.tag_list) as string[]) || []
}

export async function fetchInit(): Promise<InitData> {
  if (USE_MOCK) return (initRaw as { status: boolean; msg: string; data: InitData }).data
  const r = await fetch(API.init, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const j = await r.json()
  return j.data as InitData
}

export async function fetchGames(params: {
  keywords: string
  page: number
  tid: string
  tags: string[]
}): Promise<GameListResponse> {
  if (USE_MOCK) {
    const all = gamesAll as Game[]
    const kw = params.keywords.trim()
    const tags = params.tags || []
    // 关键字与标签筛选相互独立、可同时生效：
    // - 关键字：标题包含
    // - 标签：游戏须同时包含所选的全部标签（AND，逐步收窄）
    const filtered = all.filter(
      (g) =>
        (!kw || g.title.includes(kw)) &&
        (tags.length === 0 || tags.every((t) => (g.tags || []).includes(t))),
    )
    const perPage = 12
    const total = filtered.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const start = (params.page - 1) * perPage
    return {
      total,
      per_page: perPage,
      current_page: params.page,
      last_page: lastPage,
      data: filtered.slice(start, start + perPage),
    }
  }
  const r = await fetch(API.gameList, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const j = await r.json()
  return j.data as GameListResponse
}

export async function submit(payload: SubmitPayload): Promise<{ status: boolean; msg: string }> {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 400))
    return { status: true, msg: 'ok' }
  }
  const r = await fetch(API.submit, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const j = await r.json()
  return { status: !!j.status, msg: j.msg ?? '' }
}
