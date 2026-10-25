import { useState } from 'react'

export function SubmitDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (f: { phone: string; fullname: string }) => Promise<void> | void
}) {
  const [phone, setPhone] = useState('')
  const [fullname, setFullname] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function submit() {
    if (!/^1\d{10}$/.test(phone)) {
      setErr('请输入正确的 11 位手机号')
      return
    }
    if (!fullname.trim()) {
      setErr('请填写姓名')
      return
    }
    setErr('')
    setLoading(true)
    await onSubmit({ phone, fullname })
    setLoading(false)
    setPhone('')
    setFullname('')
  }

  return (
    <>
      <div className="mask" onClick={onClose} />
      <div className="dialog">
        <h3>提交选装清单</h3>
        <div className="field">
          <label>手机号</label>
          <input
            value={phone}
            placeholder="用于接收安装通知"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="field">
          <label>姓名</label>
          <input
            value={fullname}
            placeholder="收货 / 联系人姓名"
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>
        {err && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <div className="dialog-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={submit}
          >
            {loading ? '提交中…' : '确认提交'}
          </button>
        </div>
      </div>
    </>
  )
}
