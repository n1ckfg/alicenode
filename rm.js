const fs = require('fs')
const path = require('path')

const serverPath = __dirname


// if (fs.existsSync(path.join(serverPath, '/*.json'))) {
//   console.log('found userlist.json')

// } else {
//   fs.writeFileSync(path.join(serverPath, 'userlist.json'), '{}', 'utf8')
//   console.log('nto found"')
//  // console.log('created userlist.json on ' + os.hostname())
// }

listFiles()
function listFiles () {
  cardsFileList = fs.readdirSync(serverPath + '/cpp2json/output').filter(function (file) {
      if (file.includes('.json')) {
        fs.unlink(serverPath + '/cpp2json/output/' + file, (err) => {
          if (err) throw err;
          console.log('/cpp2json/output/' + file + ' was deleted');
        });
        
      // to do add filter that makes sure it ignores folders! maybe in the future we'll want to recursively search folders, but for now, folders likely indicate either git meta, worktrees, or tmp.
      console.log(file)
      }
    else {
      return file
    }
  })
}