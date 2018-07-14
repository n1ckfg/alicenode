echo off
title Inhabitat Launcher


REM :: launch resiliency.js
REM echo running our resiliency script
REM start node resiliency.js &

REM :: Start Alice!
REM start ..\alicenode\alice.exe project.dll

REM echo Exit Code is %errorlevel%
REM :: should we launch the resiliency script before or after everything else is launched?
REM :: for now running it after everything else


:: Exit this script if terminated by another process
:: trap "exit" INT TERM ERR
:: make sure to kill all processes started by this script, if/when this script exits via ctrl-c

REM function cleanup {
REM   echo "exit launch found, exiting resiliency.js, Max, Alice"
REM   Taskkill /IM node.exe
REM   node patchControl.js
REM   Taskkill /IM alice.exe
REM }

echo "Insuperposition Launcher"
echo starting alicenode server, serverMode set to 'nosim'
start npm \start nosim & 
:: launch resiliency.js
echo running our resiliency script
start node resiliency.js & 

:: launch max and audiostate patcher  
start ../alicenode_inhabitat/audio/audiostate_sonification.maxpat &
echo "Launching Max/MSP & Sonification Patch on process ID $!" &

:: Start Alice!
echo Starting Alice!
cd ..\alicenode_inhabitat
..\alicenode\alice.exe project.dll
echo Exit Code is %errorlevel%

pause




