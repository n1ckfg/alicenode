const fs = require('fs')
const serverPath = __dirname

let errors = {}
let restarts = {}

let ufxErrors = {}
aliceReport = {}
function writeReport() {
  fs.writeFileSync(serverPath + "/aliceReport.json", JSON.stringify(aliceReport, null, 2),  'utf-8')
}

aliceReport = JSON.parse(fs.readFileSync(serverPath + "/aliceReport.json"));
console.log(aliceReport)
ufxErrors = aliceReport.ufxErrors;
ufxErrors++
//console.log(ufxErrors)

ufxErrors.ufxErrors = ufxErrors
console.log(ufxErrors)
aliceReport.uxfErrors = ufxErrors
writeReport();