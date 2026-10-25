import { useState, useEffect } from 'react'
import type { HistoryRecord } from '../types'
import { getPlatform } from '../api'

// 按平台隔离历史，避免同一域名下多个 game_select_* 共用 localStorage 串数据
const KEY = `yxg_history_${getPlatform()}`

export function useHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([])

  useEffect(() => {
    try {
      setRecords(JSON.parse(localStorage.getItem(KEY) || '[]'))
    } catch {
      setRecords([])
    }
  }, [])

  function save(r: HistoryRecord) {
    const next = [r, ...records]
    setRecords(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  function del(ts: number) {
    const next = records.filter((r) => r.timeStamp !== ts)
    setRecords(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return { records, save, del }
}
