export function Header({ platform }: { platform: string }) {
  return (
    <header className="app-header">
      <div className="title">
        <span className="dot" /> {platform} 游戏选装
      </div>
    </header>
  )
}
