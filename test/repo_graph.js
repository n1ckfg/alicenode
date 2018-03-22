var exec = require('child-process-promise').exec;


var filewatcher = require('filewatcher');

var watcher = filewatcher();
var child;


revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp ' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot', (err, stdout, stderr) => {

		//convert the digraph to svg
		exec('dot -Tsvg repo_graph.dot -o client/repo_graph.svg', (err, stdout, stderr) => {


	})
	})

/*
//perhaps no longer necessary serving the file on 
//run the http server for the repo_graph.html to access the .svg file
exec('http-server ' + process.argv[2] + "/test --cors=\'index.html\' -p 8081", (err, stdout, stderr) => {
	});
*/

//make sure a target repo is specified in CLI arg, exit if null. 
if( process.argv[2] == null ){
console.log("ERROR: no repo specified\ntry: \'node repo_graph.js <path_of_target_repo>\'")
process.exit(1);
}



//If target repo provided as CLI arg, then watch the directory specified in the process.argv[2] so that it automates the 
//making of the graphs whenever a commit is made

else {
	console.log("watching repo: " + process.argv[2])

	watcher.add(process.argv[2] + "/.git/objects");

	watcher.on('change', function(file, stat) {
	
	//generate a digraph of the updated git history
	revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot', (err, stdout, stderr) => {

		//convert the digraph to svg
		exec('dot -Tsvg repo_graph.dot -o client/repo_graph.svg', (err, stdout, stderr) => {


	})

		  console.log('File modified: %s', file);
			  if (!stat) console.log('deleted');

			});//("node makedag.js")


//get the commit history and parents. using only one branch for now (master)

})




}
