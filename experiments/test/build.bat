@if "%_echo%"=="" echo off 

REM set up a local environment for this batch file
@setlocal

REM load Visual Studio 2017 developer command prompt
REM If this is not set, VsDevCmd.bat will change %cd% to [USERPROFILE]\source, causing the build to fail.
SET VSCMD_START_DIR=%cd%
SET VCVARS64=VC\Auxiliary\Build\vcvars64.bat
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%"


REM switch to 64-bit?
REM @if "%PROCESSOR_ARCHITECTURE%" == "AMD64" if exist "%VCINSTALLDIR%vcvarsall.bat" call "%VCINSTALLDIR%vcvarsall.bat" amd64 )

REM compile & link:
REM cl /nologo /W3 /EHsc /O2 /I ../dependencies/include alice.cpp ../dependencies/lib/win64/lib-vc2017/glfw3.lib user32.lib kernel32.lib shell32.lib gdi32.lib opengl32.lib /link /out:alice.exe

REM compile & link:
cl /LD /W3 /EHsc /O2 ^
/I ../dependencies/include ^
alice.cpp ^
../dependencies/lib/win64/lib-vc2017/glfw3.lib ^
user32.lib kernel32.lib shell32.lib gdi32.lib ^
opengl32.lib 

@del alice.obj alice.exp

dumpbin /exports alice.lib

REM compile & link:
cl /LD /W3 /EHsc /O2 ^
/I ../dependencies/include ^
alice.lib ^
sim.cpp ^
user32.lib kernel32.lib shell32.lib gdi32.lib ^
opengl32.lib 

@del sim.obj sim.exp

:ENDLOCAL
REM put things back
@endlocal

REM alice.exe
node start.js