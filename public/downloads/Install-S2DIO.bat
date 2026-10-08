@echo off
title S2DIO Master Bridge - 1-Click VST3 Installer
echo ========================================================
echo Installing S2DIO Master Bridge VST3 for your DAW...
echo ========================================================

set "TARGET_DIR=%COMMONPROGRAMFILES%\VST3\S2DIO Master Bridge.vst3"
if not exist "%COMMONPROGRAMFILES%\VST3" (
    mkdir "%COMMONPROGRAMFILES%\VST3"
)

xcopy /E /I /Y "S2DIO Master Bridge.vst3" "%TARGET_DIR%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] S2DIO Master Bridge VST3 installed to:
    echo %TARGET_DIR%
    echo.
    echo Open FL Studio, Ableton, Cubase, or Reaper, rescan plugins,
    echo and insert 'S2DIO Master Bridge' onto your Master track.
    echo.
) else (
    echo.
    echo [NOTICE] If permission failed, right-click this file and select 'Run as administrator'.
    echo.
)

pause
