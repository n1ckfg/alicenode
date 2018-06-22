


think about nested scopes of code, and think about different kinds of event sources


1. a data structure to represent a "patcher". Probably json, or dot. A list (or dictionary) of nodes, a list of arcs between them, and maybe some other metadata global to the patcher. 

2. a way of visually representing the patcher in a browser window.
    examples: 
    highly appealing: 
    https://gojs.net/latest/samples/grouping.html
    https://gojs.net/latest/samples/dynamicPorts.html
    nice features:
    https://gojs.net/latest/samples/interactiveForce.html
    https://gojs.net/latest/samples/customContextMenu.html
    https://gojs.net/latest/samples/linksToLinks.html
    https://gojs.net/latest/samples/localView.html
    https://gojs.net/latest/samples/dataFlow.html --- this one might be of interest to graham as its similar to the blueprints' exec cords

3. serving the patcher from a node.js server to the browser.

4. adding editing facilites to the browser: 
- create new object (and type in text)
- delete object
- create arc between objects
- delete arc

5. the default node operator is the "code card", in which arbitrary C++ code can be written.

6. create a "generator" that parses the patcher data structure, and outputs a new text representation of it (as C++ code)

7. create a library of "operators" that can be used in a patcher, e.g. "in", "out", "+", etc. these library entries will need to define:
- operator name
- inputs & outputs
- how to generate C++ code

further: subpatchers etc.


thoughts on the patching: 

I like Unreal Blueprints' idea that there is a special "Exec" cord between objects, that explicitly sets the order of operations. An Exec output can only connect to 1 exec input. Special operators (if, seq, foreach, etc.) can have more than one Exec output. Some operators (e.g. constant values) have no Exec output.













