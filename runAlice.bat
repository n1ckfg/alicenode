::for some reason node in the resiliency script is having trouble launching alice on the windows machine... so here's a workaround that will be called by a child process in resiliency. its dumb, but does it work?

:: Start Alice!
echo Starting Alice!
cd ..\alicenode_inhabitat
..\alicenode\alice.exe project.dll
echo Exit Code is %errorlevel%