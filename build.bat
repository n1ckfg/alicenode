@if "%_echo%"=="" echo off 
@setlocal
SET VSCMD_START_DIR=%cd%
SET VCVARS64=VC\Auxiliary\Build\vcvars64.bat
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\%VCVARS64%"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%" call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\%VCVARS64%"

rem compile & link:
cl /W3 /EHsc /O2 ^
/I include ^
/I include/uv ^
src/alice.cpp ^
/link ^
/WHOLEARCHIVE:lib/win64/lib-vc2017/libuv.lib ^
lib/win64/lib-vc2017/glfw3.lib ^
user32.lib kernel32.lib shell32.lib gdi32.lib ^
advapi32.lib iphlpapi.lib psapi.lib userenv.lib ws2_32.lib ^
opengl32.lib 

@del alice.obj alice.exp

rem dumpbin /exports alice.lib

@endlocal

node server.js