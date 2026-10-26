export interface Game {
  aid: string
  flag: string
  title: string
  litpic: string
  is_news: number
  gamesize: string
  gametype: string
  language: string
  tags?: string[]
}

export interface DiskOption {
  type: number
  id: number
  capacity: number
  title: string
  submit: string
}

export interface Category {
  id: number
  typename: string
}

export interface InitData {
  cate_list: Category[]
  hard_disk: DiskOption[]
  attach_hard_disk: DiskOption[]
}

export interface GameListResponse {
  total: number
  per_page: number
  current_page: number
  last_page: number
  data: Game[]
}

export interface SubmitPayload {
  phone: string
  fullname: string
  game: string
  c_id: number | null
  c_id1: number | null
}

export interface HistoryRecord {
  form: {
    phone: string
    fullname: string
    inDiskId: number | null
    outDiskId: number | null
  }
  selected: Game[]
  createDate: string
  timeStamp: number
  submitted?: boolean
}
