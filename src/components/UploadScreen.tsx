import { CapacityBar } from './CapacityBar'
import { AdSlot } from './AdSlot'

export type UploadStage = 'uploading' | 'success' | 'failed'

// 进度圈几何参数：半径 45，周长 ≈ 282.74
const R = 45
const C = 2 * Math.PI * R

export function UploadScreen({
  stage,
  stats,
  progress,
  errorMsg,
  adSlot,
  platform,
  onRetry,
  onClose,
}: {
  stage: UploadStage
  stats: { count: number; size: number; cap: number; remaining: number } | null
  /** 上传进度 0-100（仅 uploading 阶段使用） */
  progress?: number
  errorMsg?: string
  adSlot?: string
  platform: string
  onRetry: () => void
  onClose: () => void
}) {
  const p = Math.max(0, Math.min(100, progress ?? 0))
  const offset = C * (1 - p / 100)
  return (
    <div id="upload-screen" className={`upload-screen stage-${stage}`}>
      <div className="upload-inner">
        {stage === 'uploading' && (
          <>
            <div className="upload-progress" aria-label="上传进度">
              <svg viewBox="0 0 100 100">
                <circle className="track" cx="50" cy="50" r={R} />
                <circle
                  className="bar"
                  cx="50"
                  cy="50"
                  r={R}
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                />
              </svg>
              <span className="pct">{Math.round(p)}%</span>
            </div>
            <h2>正在上传选装清单…</h2>
            <p>请稍候，正在为您提交</p>
            {/* 上传中同样展示已选统计与广告，与成功/失败界面保持一致 */}
            {stats && (
              <CapacityBar
                selectedCount={stats.count}
                selectedSize={stats.size}
                diskCap={stats.cap}
                remaining={stats.remaining}
                cornerLabel={platform}
              />
            )}
            {/* 上传中即挂载广告，利用固定时长让其有机会加载填充 */}
            {adSlot && <AdSlot slot={adSlot} />}
          </>
        )}

        {stage === 'success' && (
          <>
            <div className="success-check">✓</div>
            <h2>上传成功</h2>
            <p>商家将尽快与您联系</p>
            {stats && (
              <CapacityBar
                selectedCount={stats.count}
                selectedSize={stats.size}
                diskCap={stats.cap}
                remaining={stats.remaining}
                cornerLabel={platform}
              />
            )}
            {adSlot && <AdSlot slot={adSlot} />}
            <button className="btn btn-primary" onClick={onClose}>
              完成
            </button>
          </>
        )}

        {stage === 'failed' && (
          <>
            <div className="upload-failed-icon">×</div>
            <h2>上传失败</h2>
            <p>{errorMsg || '提交未成功，请重试'}</p>
            {/* 失败时同样展示已选统计与广告，与成功界面保持一致 */}
            {stats && (
              <CapacityBar
                selectedCount={stats.count}
                selectedSize={stats.size}
                diskCap={stats.cap}
                remaining={stats.remaining}
                cornerLabel={platform}
              />
            )}
            {adSlot && <AdSlot slot={adSlot} />}
            <div className="dialog-actions" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
                返回
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onRetry}>
                重试
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
