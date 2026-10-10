@echo off
cd /d "%~dp0"
echo Envoi du projet vers GitHub.
where git >nul 2>nul
if errorlevel 1 goto nogit
for /f "delims=" %%i in ('git config --global user.email 2^>nul') do set GITMAIL=%%i
if not "%GITMAIL%"=="" goto hasident
set /p GMAIL="Ton email GitHub : "
set /p GNAME="Ton nom : "
git config --global user.email "%GMAIL%"
git config --global user.name "%GNAME%"
:hasident
if exist ".git\" goto hasrepo
git init
git branch -M main
git remote add origin https://github.com/Lionel1982/bataille.git
goto commit
:hasrepo
git remote set-url origin https://github.com/Lionel1982/bataille.git
:commit
git add -A
set /p MSG="Message (laisse vide pour 'maj jeu') : "
if "%MSG%"=="" set MSG=maj jeu
git commit -m "%MSG%"
git push -u origin main
echo.
echo Termine. Verifie sur https://github.com/Lionel1982/bataille
goto end
:nogit
echo [ERREUR] git introuvable. Installe-le depuis https://git-scm.com
goto end
:end
echo.
pause
