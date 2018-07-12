#!/bin/bash
# Exit this script if terminated by another process
# trap "exit" INT TERM ERR
# make sure to kill all processes started by this script, if/when this script exits via ctrl-c
trap cleanup EXIT

function cleanup {
  echo "exit launch found, exiting resiliency.js, Max, Alice"
  killall node
  node patchControl.js
  killall Alice
}

echo "Insuperposition Launcher"

# launch resiliency.js
echo running our resiliency script
node resiliency.js & 

# launch max and audiostate patcher  
open -a Max ../alicenode_inhabitat/audio/audiostate_sonification.maxpat &
echo "Launching Max/MSP & Sonification Patch on process ID $!" &

# Start Alice!
echo Starting Alice!
../alicenode/alice project.dylib
echo Exit Code is %errorlevel%

wait