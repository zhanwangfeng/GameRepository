import type { DiskOption } from '../types'

export function DiskSelector({
  builtIn,
  external,
  inDiskId,
  outDiskId,
  onIn,
  onOut,
}: {
  builtIn: DiskOption[]
  external: DiskOption[]
  inDiskId: number | null
  outDiskId: number | null
  onIn: (id: number | null) => void
  onOut: (id: number | null) => void
}) {
  return (
    <div className="section">
      <div className="section-title">内置硬盘（主机自带）</div>
      <div className="disk-row">
        {builtIn.map((d) => (
          <div
            key={d.id}
            className={`disk-pill ${inDiskId === d.id ? 'active' : ''}`}
            onClick={() => onIn(inDiskId === d.id ? null : d.id)}
          >
            {d.title}
          </div>
        ))}
      </div>
      <div className="section-title" style={{ marginTop: 14 }}>
        外置硬盘（扩展）
      </div>
      <div className="disk-row">
        {external.map((d) => (
          <div
            key={d.id}
            className={`disk-pill ${outDiskId === d.id ? 'active' : ''}`}
            onClick={() => onOut(outDiskId === d.id ? null : d.id)}
          >
            {d.title}
          </div>
        ))}
      </div>
    </div>
  )
}
