// 仅在配置了 VITE_ADSENSE_CLIENT 时才注入 Google AdSense 脚本；
// 未配置则完全不添加任何广告代码。
export function initAdsense() {
  const client = (import.meta.env as any).VITE_ADSENSE_CLIENT as string | undefined
  if (!client) return
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return
  const s = document.createElement('script')
  s.async = true
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
}
