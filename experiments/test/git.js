const nodegit = require("nodegit");

var path = require("path");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var fs = require("fs");
var fileName = "sim.cpp";
//var fileContent = "hello world";
var directoryName = "/test";
// ensureDir is an alias to mkdirp, which has the callback with a weird name
// and in the 3rd position of 4 (the 4th being used for recursion). We have to
// force promisify it, because promisify-node won't detect it on its
// own and assumes sync
fse.ensureDir = promisify(fse.ensureDir);



if( process.argv[2] | process.argv[3] == null ){
console.log("ERROR: no repo or filename specified\ntry: \'git.js <path_of_target_repo> <filename><\'")
process.exit(1);
}

var utc = Date.now();

/**
 * This example creates a certain file `newfile.txt`, adds it to the git
 * index and commits it to head. Similar to a `git add newfile.txt`
 * followed by a `git commit`
**/

var repo;
var index;
var oid;

var filepath = (process.argv[2] + "/" + process.argv[3]);

/*
fs.watch(filepath, (ev, filename) => {
	if (ev == "change") {
		console.log(ev, filename);

*/

nodegit.Repository.open(path.resolve(__dirname, "../.git"))
.then(function(repoResult) {
  repo = repoResult;
  return fse.ensureDir(path.join(repo.workdir(), directoryName));
  console.log(repo)
})

.then(function() {
  return repo.refreshIndex();
})
.then(function(indexResult) {
  index = indexResult;
  console.log(index)
})
.then(function() {
  // this file is in the root of the directory and doesn't need a full path
  return index.addByPath(process.argv[3]);
})
.then(function() {
  // this file is in a subdirectory and can use a relative path
  return index.addByPath(path.posix.join(__dirname, fileName));
})
.then(function() {
  // this will write both files to the index
  return index.write();
})
.then(function() {
  return index.writeTree();
})
.then(function(oidResult) {
  oid = oidResult;
  return nodegit.Reference.nameToId(repo, "HEAD");
})
.then(function(head) {
  return repo.getCommit(head);
})
.then(function(parent) {
  var author = nodegit.Signature.create("michaelpalumbo",
    "emailmichaelpalumbo@gmail.com", utc, 60);
  var committer = nodegit.Signature.create("michael",
    "emailmichaelpalumbo@gmail.com", utc, 90);

  return repo.createCommit("HEAD", author, committer, "message", oid, [parent]);
})
.done(function(commitId) {
  console.log("New Commit: ", commitId);
});





//}}) 

