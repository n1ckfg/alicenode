var exec = require('child-process-promise').exec;


var filewatcher = require('filewatcher');


/* next step(s) here is to point this code below to watch the directory specified in the process.argv[2] so that it automates the 
making of the graphs whenever a commit is made


var watcher = filewatcher();
var child;

watcher.add(__dirname + "/.git/objects");

watcher.on('change', function(file, stat) {
//test commit
	child = exec("node makedag.js")
  console.log('File modified: %s', file);
  if (!stat) console.log('deleted');
});("node makedag.js")


*/



if( process.argv[2] == null ){
console.log("no repo specified, using: " + __dirname, "\ntry: node make_git_gv.git <path>")

//get the commit history and parents. check the 'git-big-picture' repo for all settings. later on if we want we can customize the output so it 
//only shows certain commits. 
revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations ' + __dirname + ' > repo_graph.dot', (err, stdout, stderr) => {
	//console.log(stdout);
	//find names of branch heads

	exec('dot -Tsvg repo_graph.dot -o repo_graph.svg', (err, stdout, stderr) => {

	//	exec('open -a \"Chrome\" repo_graph.svg');

				})
		})
}

else {

console.log("using: " + process.argv[2])

//get the commit history and parents. using only one branch for now (master)
revList = exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations ' + process.argv[2] + ' > repo_graph.dot', (err, stdout, stderr) => {


	exec('dot -Tsvg repo_graph.dot -o repo_graph.svg', (err, stdout, stderr) => {

		//exec('open -a \"Chrome\" repo_graph.svg'); doesn't work with exec

	})
})




}
