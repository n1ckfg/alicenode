var NodeGit = require("nodegit");

var name = process.argv[2];


if( name == null ){
console.log("ERROR: no repo specified\ntry: \'node git.js <name of target repo>\'")
process.exit(1);
}

/*

var pathToRepo = require("path").resolve("../" + name);
var isBare = 0; // lets create a .git subfolder


NodeGit.Repository.init(pathToRepo, isBare).then(function (repo) {
  // In this function we have a repo object that we can perform git operations
  // on.
console.log(repo, name);
  // Note that with a new repository many functions will fail until there is
  // an initial commit.
});
*/