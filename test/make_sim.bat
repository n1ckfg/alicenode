@if "%_echo%"=="" echo off 

rem set up a local environment for this batch file (necessary!)
@setlocal

rem initialize as Visual Studio 2017 developer command prompt but keep the current directory
set VSCMD_START_DIR=%cd%
rem for /r "%ProgramFiles(x86)%\Microsoft Visual Studio\2017" %%a in (vcvars64.bat) do if exist "%%~fa" call "%%~fa"
set VCVARS64=VC\Auxiliary\Build\vcvars64.bat
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%"

rem compile & link, then clean up
cl /nologo /LD /W3 /EHsc /O2 /I ../dependencies/include alice.lib %* 
@del sim.obj sim.exp

rem put things back
@endlocal