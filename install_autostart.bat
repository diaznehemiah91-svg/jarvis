@echo off
REM ============================================================
REM  Install JARVIS to run automatically when Windows starts.
REM  Creates a shortcut to start_jarvis.bat in the Startup folder.
REM  Run this once. To undo, delete JARVIS.lnk from shell:startup.
REM ============================================================

setlocal
set VBS="%TEMP%\jarvis_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell")          >  %VBS%
echo sLink = oWS.SpecialFolders("Startup") ^& "\JARVIS.lnk"   >> %VBS%
echo Set oLink = oWS.CreateShortcut(sLink)                    >> %VBS%
echo oLink.TargetPath = "%~dp0start_jarvis.bat"               >> %VBS%
echo oLink.WorkingDirectory = "%~dp0"                         >> %VBS%
echo oLink.WindowStyle = 7                                    >> %VBS%
echo oLink.Description = "JARVIS Command Center"              >> %VBS%
echo oLink.Save                                               >> %VBS%

cscript /nologo %VBS%
del %VBS%

echo.
echo  [+] JARVIS will now launch automatically at Windows startup.
echo      Shortcut created in your Startup folder (shell:startup).
echo.
echo  To remove autostart: press Win+R, type  shell:startup
echo  and delete  JARVIS.lnk
echo.
pause
