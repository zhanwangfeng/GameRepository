@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM 若依赖未安装，则先安装（仅在首次运行时需要）
if not exist node_modules (
  echo 首次运行，正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查 Node.js / npm 环境后重试。
    pause
    exit /b 1
  )
)

echo 正在启动服务（会自动打开浏览器）...
echo 如需手动打开，访问 http://localhost:5173/
echo.
call npm run dev -- --open --host --port 5173

pause
