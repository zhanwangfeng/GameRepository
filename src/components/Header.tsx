const VERSION = '0.1.0'

export function Header({ platform }: { platform: string }) {
  return (
    <header className="app-header">
      <div className="title">
        <span className="title-main">
          <span className="dot" /> {platform} 游戏选装
        </span>
        <span className="ver">v{VERSION}</span>
      </div>
    </header>
  )
}
