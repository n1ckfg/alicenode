const { execSync } = require('child_process')
const { process, server_path, console } = require('./server')
/// //////////////////////////////////////////////////////////////////////////////
// BUILD PROJECT
function project_build () {
  let out = ''
  if (process.platform === 'win32') {
    out = execSync('build.bat "' + server_path + '"', { stdio: 'inherit' })
  } else {
    out = execSync('sh build.sh "' + server_path + '"', { stdio: 'inherit' })
  }
  console.log('built project', out.toString())
}
exports.project_build = project_build
