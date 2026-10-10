@echo off
cd /d "%~dp0"
echo ============================================
echo   Resolution des conflits (on garde TA version)
echo ============================================
where git >nul 2>nul
if errorlevel 1 goto nogit

echo On garde la version locale pour tous les fichiers en conflit...
git checkout --ours .
git add -A
git commit -m "fusion : on garde le jeu React" --no-edit
if errorlevel 1 goto commitnote
goto push

:commitnote
echo (rien a committer ou commit deja fait, on continue)

:push
echo.
echo Envoi vers GitHub...
git push -u origin main
if errorlevel 1 goto pushfail
echo.
echo ============================================
echo   OK ! Le jeu est sur GitHub.
echo   https://github.com/Lionel1982/bataille
echo ============================================
goto end

:pushfail
echo [ERREUR] L'envoi a echoue. Copie tout le texte et montre-le moi.
goto end

:nogit
echo [ERREUR] git introuvable.
goto end

:end
echo.
pause
