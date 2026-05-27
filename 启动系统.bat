@echo off
chcp 65001 >nul
echo ========================================
echo   消防培训获客系统 - 正在启动...
echo ========================================
echo.

if not exist "node_modules" (
  echo [第一步] 正在安装依赖包，请稍等...
  call npm install
  echo.
)

echo [第二步] 启动服务器...
echo.
start "" "http://localhost:3000"
node server.js

pause
