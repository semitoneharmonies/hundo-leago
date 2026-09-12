@echo off
setlocal

set "HUNDO_FRONTEND_ROOT=%~dp0.."
set "HUNDO_NODE_RUNTIME=%HUNDO_FRONTEND_ROOT%\.tools\node-v24.14.1-win-x64"

if not exist "%HUNDO_NODE_RUNTIME%\node.exe" (
  echo Approved Node runtime not found at "%HUNDO_NODE_RUNTIME%". 1>&2
  echo Restore the verified Node 24.14.1 Windows x64 runtime before running release gates. 1>&2
  exit /b 1
)

set "PATH=%HUNDO_NODE_RUNTIME%;%PATH%"
call "%HUNDO_NODE_RUNTIME%\npm.cmd" %*
exit /b %ERRORLEVEL%
