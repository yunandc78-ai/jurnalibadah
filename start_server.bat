@echo off
title Server Jurnal Ibadah AMWA (PHP MySQL)
echo ========================================================
echo   MENJALANKAN SERVER JURNAL IBADAH AMWA (PHP + MYSQL)
echo ========================================================
echo.
echo Pastikan Apache & MySQL di XAMPP Control Panel sudah di-START!
echo.
echo Membuka server lokal di: http://localhost:8000
echo Tekan Ctrl+C untuk menghentikan server.
echo.

set PHP_PATH=C:\xampp\php\php.exe

start http://localhost:8000

if exist "%PHP_PATH%" (
    "%PHP_PATH%" -S localhost:8000
) else (
    php -S localhost:8000
)
pause
