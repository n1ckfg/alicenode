var nodegit = require('nodegit'),
    path = require('path');



//help!
if (process.argv[2] == ("--help" || '-h')) {

	console.log("	clone <github repo url> -- clone a repository \n\n	open <repo name> -- open a local repository \n\n	history <repo name> -- print the commit hash and message per commit")
}

// run 'node git.js clone <repo_url>'

if (process.argv[3].includes("clone")) {

var url = process.argv[2],
    git = (url.lastIndexOf('/'));
    name = url.substring(git + 1);
    local = name.substring(0,name.indexOf('.'));
    console.log(local)
    cloneOpts = {};

	nodegit.Clone(url, local, cloneOpts).then(function (repo) {
		    console.log("Cloned " + path.basename(url) + " to " + repo.workdir());
			}).catch(function (err) {
			    console.log(err);
	});
}


// open a local repository

if (process.argv[3].includes("open")) {

var name = ('./' + process.argv[2])
	nodegit.Repository.open(name).then(function(repo) {
	  console.log("Using " + repo.path());
		}).catch(function (err) {
		  console.log(err);
	});
}




// get commit hash and message 
if (process.argv[3].includes("history")) {
	var name = ('./' + process.argv[2])

		nodegit.Repository.open(name).then(function(repo) {
		  // Get the current branch. 
		  return repo.getCurrentBranch().then(function(ref) {
		    console.log("On " + ref.shorthand() + " (" + ref.target() + ")");

		    // Get the commit that the branch points at. 
		    return repo.getBranchCommit(ref.shorthand());
		  }).then(function (commit) {
		    // Set up the event emitter and a promise to resolve when it finishes up. 
		    var hist = commit.history(),
		        p = new Promise(function(resolve, reject) {
		            hist.on("end", resolve);
		            hist.on("error", reject);
		        });
		    hist.start();
		    return p;
		  }).then(function (commits) {
		    // Iterate through the last 10 commits of the history. 
		    for (var i = 0; i < 10; i++) {
		      var sha = commits[i].sha().substr(0,7),
		          msg = commits[i].message().split('\n')[0];
		      console.log(sha + " " + msg);
		    }
		  });
		}).catch(function (err) {
		  console.log(err);
		}).done(function () {
		  console.log('Finished');
		});

	}

	