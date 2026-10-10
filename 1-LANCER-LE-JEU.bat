@echo off
cd /d "%~dp0"
echo ============================================
echo   Bataille de Po/ets - lancement local
echo ============================================
where node >nul 2>nul
if errorlevel 1 goto nonode
if not exist "node_modules\" goto install
goto run

:install
echo Premiere installation des dependances. Patiente 1 a 2 minutes.
call npm install
if errorlevel 1 goto failinstall
goto run

:run
echo.
echo Demarrage du serveur. Le navigateur va s'ouvrir.
echo Pour arreter le jeu, ferme cette fenetre.
start "" http://localhost:5173
call npm run dev
goto end

:nonode
echo [ERREUR] Node.js est introuvable.
echo Ferme cette fenetre, rouvre-la, et reessaie.
echo Si ca persiste, reinstalle Node depuis https://nodejs.org
goto end

:failinstall
echo [ERREUR] L'installation a echoue. Verifie ta connexion internet.
goto end

:end
echo.
pause
