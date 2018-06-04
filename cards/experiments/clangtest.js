var libclang = require('libclang');

var index = new libclang.Index();
//var tu = new libclang.TranslationUnit();

//tu.fromSource(index, 'state.h', ['-I'+__dirname]);;

var tu = libclang.TranslationUnit.fromSource(index, "state.h", []);

tu.cursor.visitChildren(function (parent) {
    
    console.log(this.kind, JSON.stringify(libclang(this.kind)));
  
  
  return libclang.CXChildVisit_Continue;
});

index.dispose();
//tu.dispose();