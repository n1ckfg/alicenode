const fs = require("fs");

//console.log(process.argv)
let jsonfile = process.argv[2] || "test.json";
let ast = JSON.parse(fs.readFileSync(jsonfile, "utf-8"));
let src = fs.readFileSync(ast.filename, "utf-8");
let res = [];

for (let d of ast.nodes) {
	//console.log(d);
	if (d.ast == "FunctionDecl") {
		if (d.comment) {
			res.push(d.comment.text, "\n");
		}
		let params = d.nodes.slice(0, -1).map(node => `${node.type} ${node.name}`);
		let body = d.nodes[d.nodes.length-1];
		
		res.push(
			`${d.type_ret} ${d.name}(${params.join(", ")}) `,
			src.substr(body.loc.begin.char, body.loc.end.char - body.loc.begin.char), 
			"\n\n");
	} else {
		console.error("unexpected ast type" + d.ast);
	}
}

console.log(res.join(""));