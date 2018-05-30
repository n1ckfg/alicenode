function alice_command(command,arg) {
         let msg = command + "?" + arg + "\0";
         console.log("sending alice", msg);
         alice.stdin.write(command + "?" + arg + "\0");
     }