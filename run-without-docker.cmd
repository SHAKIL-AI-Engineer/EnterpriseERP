@echo off
REM Enterprise ERP - run Platform.Host + hrhub WITHOUT Docker (double-click me)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-without-docker.ps1" %*