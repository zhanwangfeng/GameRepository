import { useEffect, useRef } from 'react'

type AdSlotProps = {
  slot: string
  format?: 'horizontal' | 'vertical' | 'rectangle'
  className?: string
}

export function AdSlot({ slot, format = 'horizontal', className }: AdSlotProps) {
  const ref = useRef<HTMLModElement | null>(null)
  const pushed = useRef(false)
  const client = (import.meta.env as any).VITE_ADSENSE_CLIENT as string | undefined

  // 未配置 AdSense 发布者 ID 时，不渲染任何广告代码
  if (!client) return null

  useEffect(() => {
    const el = ref.current
    if (!el || pushed.current) return
    const attempt = () => {
      const w = window as any
      if (w.adsbygoogle) {
        try {
          w.adsbygoogle.push({})
          pushed.current = true
        } catch (e) {
          /* 忽略 AdSense 重复 push 等异常 */
        }
      } else {
        setTimeout(attempt, 300)
      }
    }
    attempt()
  }, [])

  return (
    <div className={`ad-banner ${className ?? ''}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
