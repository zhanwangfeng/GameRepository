import pkg from '../../package.json'

export function Header({ platform }: { platform: string }) {
  return (
    <header className="app-header">
      <div className="title">
        <span className="title-main">
          <span className="dot" /> {platform} 游戏选装
        </span>
        <span className="ver">v{pkg.version}</span>
      </div>
    </header>
  )
}
