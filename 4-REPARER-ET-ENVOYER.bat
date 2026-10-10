@echo off
cd /d "%~dp0"
echo ============================================
echo   Reparation : fusion du depot distant
echo ============================================
where git >nul 2>nul
if errorlevel 1 goto nogit

echo Recuperation du contenu distant...
git pull origin main --allow-unrelated-histories --no-edit
if errorlevel 1 goto conflict

echo.
echo Envoi de la version complete...
git add -A
git commit -m "fusion + jeu React" 2>nul
git push -u origin main
if errorlevel 1 goto pushfail
echo.
echo OK ! Verifie sur https://github.com/Lionel1982/bataille
goto end

:conflict
echo.
echo [ATTENTION] Un conflit de fusion est possible.
echo Souvent c'est juste le fichier README. Tape ceci si besoin :
echo    git checkout --ours .
echo    git add -A
echo    git commit -m fusion
echo    git push -u origin main
goto end

:pushfail
echo [ERREUR] L'envoi a encore echoue. Copie tout ce texte et montre-le moi.
goto end

:nogit
echo [ERREUR] git introuvable.
goto end

:end
echo.
pause
