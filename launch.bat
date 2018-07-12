echo off
title Inhabitat Launcher

:: Start Alice!
start node resiliency.js

start ..\alicenode\alice.exe project.dll

echo Exit Code is %errorlevel%
:: should we launch the resiliency script before or after everything else is launched?
:: for now running it after everything else

:: launch resiliency.js
echo running our resiliency script


