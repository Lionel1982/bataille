@echo off
cd /d "%~dp0"
echo Construction de la version PWA.
where node >nul 2>nul
if errorlevel 1 goto nonode
if not exist "node_modules\" call npm install
call npm run build
if errorlevel 1 goto fail
echo.
echo OK. Le dossier "dist" est pret pour Vercel.
goto end
:nonode
echo [ERREUR] Node.js introuvable.
goto end
:fail
echo [ERREUR] Le build a echoue.
goto end
:end
echo.
pause
