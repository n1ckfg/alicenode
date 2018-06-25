const fs = require("fs");

// src = {
//     ast: "A",
//     nodes: [
//         {
//             ast: "BB",
//             nodes: [
//                 {
//                     ast: "GGG",
//                     nodes: [
                        
//                     ]
//                 }
//             ]
//         },
//         {
//             ast: "CC",
//             nodes: [
                
//             ]
//         },
//         {
//             ast: "DD",
//             nodes: [
//                 {
//                     ast: "EEE",
//                     nodes: [
                        
//                     ]
//                 },
//                 {
//                     ast: "FFF",
//                     nodes: [
                        
//                     ]
//                 }
//             ]
//         }
//     ]
// }
src = JSON.parse(fs.readFileSync(__dirname + "/test.json"))
//console.log(src)
let name;
function visit(node, parentnode, ctx) {
    //console.log("enter", node.ast, "of", parentnode ? parentnode.ast : node.filename);
    
    if (node.ast == "TranslationUnit"){
        ctx.name = node.filename;
    
        //ctx.children.push(node.ast);

        let ctx1 = {
            name: name,
            children: [],
        }  


                // add more props depending on the node type

        //first check if a node has children, if not, ignore. 
        if (node.nodes){
            
            // do this for structs, tranlation units, 
            // but not for functions
            for (c of node.nodes) {
                //console.log(node.nodes)
                visit(c, node, ctx1);
            }
        // console.log("exit", node.ast);

            ctx.children.push(ctx1);

            //ctx.children.push("</div>")
        }
    } else if (node.name) {

    ctx.children.push(node.name);
    ctx.name = node.name;

    let ctx1 = {
        name: name,
        children: [],
    }
    
        // add more props depending on the node type

    //first check if a node has children, if not, ignore. 
    if (node.nodes){
        
        // do this for structs, tranlation units, 
        // but not for functions
        for (c of node.nodes) {
            //console.log(node.nodes)
            visit(c, node, ctx1);
        }
       // console.log("exit", node.ast);

        ctx.children.push(ctx1);

        //ctx.children.push("</div>")
    }

}

else if (node.mangled_name){

    ctx.children.push(node.name);
    ctx.name = node.name;

    let ctx1 = {
        name: name,
        children: [],
    }
    
        // add more props depending on the node type

    //first check if a node has children, if not, ignore. 
    if (node.nodes){
        
        // do this for structs, tranlation units, 
        // but not for functions
        for (c of node.nodes) {
            //console.log(node.nodes)
            visit(c, node, ctx1);
        }
       // console.log("exit", node.ast);

        ctx.children.push(ctx1);

        //ctx.children.push("</div>")
    }

}

}

let ctx = {
    name: name,

    children: [],
}

visit(src, null, ctx);

console.log(JSON.stringify(ctx, null, 3));


