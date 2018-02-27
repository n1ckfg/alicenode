@if "%_echo%"=="" echo off 

REM set up a local environment for this batch file
@setlocal
REM with the necessary msbuild/visual studio environment variables
REM TODO test for VS2017 also?
@if exist "%VS150COMNTOOLS%vsvars32.bat" (
    call "%VS150COMNTOOLS%vsvars32.bat"
) else (
    echo Can't find the Visual Studio build tools
)

REM load Visual Studio 2017 developer command prompt if VS150COMNTOOLS is not set
:: If this is not set, VsDevCmd.bat will change %cd% to [USERPROFILE]\source, causing the build to fail.
SET VSCMD_START_DIR=%cd%

if "%VS150COMNTOOLS%" EQU "" if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\VC\Auxiliary\Build\vcvars64.bat" (
    call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
)
if "%VS150COMNTOOLS%" EQU "" if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\VC\Auxiliary\Build\vcvars64.bat" (
    call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Professional\VC\Auxiliary\Build\vcvars64.bat"
)
if "%VS150COMNTOOLS%" EQU "" if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars64.bat" (
    call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars64.bat"
)
if "%VS150COMNTOOLS%" EQU "" if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
    call "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
)


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

REM compile & link:
cl /LD /W3 /EHsc /O2 ^
/I ../dependencies/include ^
sim.cpp ^
alice.lib

@del sim.obj sim.exp

:ENDLOCAL
REM put things back
@endlocal

REM alice.exe
node index.js