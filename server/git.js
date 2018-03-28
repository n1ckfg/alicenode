var nodegit = require('nodegit'),
    path = require('path');

//print the help

if (process.argv[2] == ("-h" || "--help")) {

	console.log("clone <github repo url> -- clone a repository \n\n	open <repo name> -- open a local repository \n\n	history <repo name> -- print the commit hash and message per commit")
	process.exit(1)

	}

//if the repo name nor action on said repo aren't stated, print error, suggest help
else if (process.argv[2] == null ) {

	console.log("\nERROR: missing arguments -- usage: \'node git.js <option> <name_of_target_repo> \' \n\nsee \'node git.js -h\' or --help for options\'\n\n")
	
	process.exit(1);

}

switch (process.argv[2]) {

	//clone a repo

	case "clone":

		var url = process.argv[3],
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
	break;	
	 
	//open a local repo
	case "open":

		// open a local repository
		var name = ('./' + process.argv[3])
		nodegit.Repository.open(name).then(function(repo) {
		  console.log("Using " + repo.path());
			}).catch(function (err) {
			  console.log(err);
		});

	//retrieve the commit hashes and their messages		
	case "history": 

		var name = ('./' + process.argv[3])

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
		    // Iterate through commits of the history. 
		    for (var i = 0; i < commits.length; i++) {
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

		break;

	case "status":

		var name = ('./' + process.argv[3])
		nodegit.Repository.open(name).then(function(repo) {

			return repo.getStatus(opts).then(function(arrayStatusFile) {
				console.log(arrayStatusFile)
				
			})
		})

}



	