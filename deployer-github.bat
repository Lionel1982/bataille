@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   Bataille de Po/ets - envoi vers GitHub
echo ==========================================
echo.

REM --- Verifier git ---
where git >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] git n'est pas installe ou pas dans le PATH.
  echo Installe-le depuis https://git-scm.com/download/win puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

REM --- Identite git si absente ---
for /f "delims=" %%i in ('git config --global user.email 2^>nul') do set GITMAIL=%%i
if "%GITMAIL%"=="" (
  set /p GMAIL="Ton email GitHub : "
  set /p GNAME="Ton nom (ex: Lionel) : "
  git config --global user.email "%GMAIL%"
  git config --global user.name "%GNAME%"
)

REM --- Init depot si besoin ---
if not exist ".git" (
  echo Initialisation du depot git...
  git init
  git branch -M main
  git remote add origin https://github.com/Lionel1982/bataille.git
) else (
  git remote set-url origin https://github.com/Lionel1982/bataille.git
)

echo.
echo Ajout des fichiers...
git add -A
set /p MSG="Message (laisse vide pour 'mise a jour jeu') : "
if "%MSG%"=="" set MSG=mise a jour jeu
git commit -m "%MSG%"

echo.
echo Envoi vers GitHub (une fenetre de connexion peut s'ouvrir la 1ere fois)...
git push -u origin main

echo.
echo ==========================================
echo   Termine. Verifie sur :
echo   https://github.com/Lionel1982/bataille.git
echo ==========================================
pause
