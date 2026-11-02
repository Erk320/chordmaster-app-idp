@echo off
title Subir Proyecto a GitHub
echo ========================================================
echo   Subiendo ChordMaster Live a GitHub...
echo ========================================================
echo.
cd /d "%~dp0"
git push -u origin master
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   EXITO: Proyecto subido correctamente a GitHub!
    echo   Ve a tu repositorio para ver la compilacion del APK:
    echo   https://github.com/Erk320/chordmaster-app-idp/actions
    echo ========================================================
) else (
    echo ========================================================
    echo   Hubo un detalle con la autenticacion.
    echo   Por favor verifica la ventana del navegador para iniciar sesion.
    echo ========================================================
)
echo.
pause
