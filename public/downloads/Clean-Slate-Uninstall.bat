@echo off
setlocal
echo ========================================================
echo   S2DIO Clean Slate Uninstaller
echo   Completely removes all installed S2DIO files & cache
echo ========================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this batch script as Administrator.
    echo Right-click this file and choose "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [1/5] Terminating any running S2DIO and WebView2 processes...
taskkill /F /IM S2DIO.exe /T >nul 2>&1
taskkill /F /IM msedgewebview2.exe /T >nul 2>&1
taskkill /F /IM "S2DIO.exe" /T >nul 2>&1

echo [2/5] Removing desktop & start menu shortcuts...
if exist "%PUBLIC%\Desktop\S2DIO.lnk" del /F /Q "%PUBLIC%\Desktop\S2DIO.lnk" >nul 2>&1
if exist "%USERPROFILE%\Desktop\S2DIO.lnk" del /F /Q "%USERPROFILE%\Desktop\S2DIO.lnk" >nul 2>&1
if exist "%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs\S2DIO.lnk" del /F /Q "%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs\S2DIO.lnk" >nul 2>&1
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\S2DIO.lnk" del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\S2DIO.lnk" >nul 2>&1

echo [3/5] Purging Program Files directory (C:\Program Files\S2DIO)...
if exist "%ProgramFiles%\S2DIO" (
    rmdir /S /Q "%ProgramFiles%\S2DIO" >nul 2>&1
)

echo [4/5] Removing VST3 Master Bridge plugin...
if exist "%CommonProgramFiles%\VST3\S2DIO Master Bridge.vst3" (
    if exist "%CommonProgramFiles%\VST3\S2DIO Master Bridge.vst3\*" (
        rmdir /S /Q "%CommonProgramFiles%\VST3\S2DIO Master Bridge.vst3" >nul 2>&1
    ) else (
        del /F /Q "%CommonProgramFiles%\VST3\S2DIO Master Bridge.vst3" >nul 2>&1
    )
)

echo [5/5] Purging user local app data and webview cache...
if exist "%LOCALAPPDATA%\S2DIO" (
    rmdir /S /Q "%LOCALAPPDATA%\S2DIO" >nul 2>&1
)

echo.
echo ========================================================
echo   Clean slate complete!
echo   All previous S2DIO files, plugins, and cache are removed.
echo   You can now install fresh using S2DIO-Windows-Setup.exe.
echo ========================================================
echo.
pause
