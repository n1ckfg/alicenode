echo off
title Inhabitat Launcher


:: launch resiliency.js
echo running our resiliency script
start node resiliency.js &

:: Start Alice!
start ..\alicenode\alice.exe project.dll

echo Exit Code is %errorlevel%
:: should we launch the resiliency script before or after everything else is launched?
:: for now running it after everything else




