var exec = require('child-process-promise').exec;


var filewatcher = require('filewatcher');

var watcher = filewatcher();
var child;



//make sure a target repo is specified in CLI arg, exit if null. 
if( process.argv[2] == null ){
console.log("ERROR: no repo specified\ntry: \'node repo_graph.js <path_of_target_repo>\'")
process.exit(1);
}


//make sure the repo_graph.svg in /client is up to date 
revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp ' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot', (err, stdout, stderr) => {

		//convert the digraph to svg
		exec('dot -Tsvg repo_graph.dot -o client/repo_graph.svg', (err, stdout, stderr) => {

			//exec('git rev-list --all --parents --timestamp -- test/sim.cpp > times.txt')

	})
	})

// 

/*
//watch for changes to sim.cpp. if changed, add/commit, then update the svg file. 
watcher.add(process.argv[2] + "test/sim.cpp");

	watcher.on('change', function(file, stat) {
	
	//add/commit the new sim.cpp
	exec('git add test/sim.cpp')
				.then(exec('git commit -m \"change to sim.cpp\"'))
					.then(exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot'))
						.then(exec('dot -Tsvg repo_graph.dot -o client/repo_graph.svg'))
							.then(exec('git status', (err, stdout, stderr) => {

							console.log(stdout)
							}))

	})
*/
			






//If target repo provided as CLI arg, then watch the directory specified in the process.argv[2] so that it automates the 
//making of the graphs whenever a commit is made
/*
else {
	console.log("watching repo: " + process.argv[2])

	watcher.add(process.argv[2] + "/.git/objects");

	watcher.on('change', function(file, stat) {
	
	//generate a digraph of the updated git history
	revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot', (err, stdout, stderr) => {

		//convert the digraph to svg
		exec('dot -Tsvg repo_graph.dot -o client/repo_graph.svg', (err, stdout, stderr) => {


	})


			});//("node makedag.js")


//get the commit history and parents. using only one branch for now (master)

})




}
*/