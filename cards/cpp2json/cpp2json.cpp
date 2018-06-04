/*

Useful references:

http://clang.llvm.org/docs/IntroductionToTheClangAST.html
http://clang.llvm.org/doxygen/group__CINDEX.html
https://jonasdevlieghere.com/understanding-the-clang-ast/


http://szelei.me/code-generator/
https://gist.github.com/bparker06/575fa83149eb2cc90375487cfe9f3442

JSON:

https://github.com/nlohmann/json/tree/master

*/

#include <clang-c/Index.h>
#include <json.hpp>
#include <stdio.h>
#include <stdlib.h>
#include <string> 

// for convenience
using json = nlohmann::json;

json jdoc;

struct VisitorData {
	int indent = 0;

	json * parent = 0;
	json * children = 0;
};

CXChildVisitResult visit (CXCursor c, CXCursor parent, CXClientData client_data) {
	
	auto kind = clang_getCursorKind(c);
	

	if (clang_isUnexposed(kind)) {

		// this is an AST node that has no useful information for CIndex
		// so we can continue to visit the children directly:
		clang_visitChildren(c, visit, client_data);

	} else {

		VisitorData& vd = *(VisitorData *)client_data;
		bool doVisitChildren = true;
	
		CXSourceRange range = clang_getCursorExtent(c);
		CXSourceLocation start = clang_getRangeStart(range);
		CXSourceLocation end = clang_getRangeEnd(range);
		// loc might not be the start of the range (e.g. it could be the where the name of a function is)
		CXSourceLocation loc = clang_getCursorLocation(c);

		CXFile file;
		unsigned line, column, offset;
		unsigned line1, column1, offset1;
		clang_getSpellingLocation(start, &file, &line, &column, &offset);
		clang_getSpellingLocation(end, &file, &line1, &column1, &offset1);

		// C++ type; may be invalid, unexposed, a built-in like int, float etc, or more
		CXType ctype = clang_getCursorType(c);

		switch(kind) {
		
		default:
		break;

		}

		json& children = (*vd.parent)["children"];
		json jnode = {
			{"kind", clang_getCString(clang_getCursorKindSpelling(kind)) }
		};
		children.push_back("x");
		
		auto str = clang_getCursorKindSpelling(kind);
		printf("%s%s at line %d:%d to line %d:%d: %s <%s>\n", std::string(vd.indent,'-').c_str(), clang_getCString(str), line, column, line1, column1, clang_getCString(clang_getCursorSpelling(c)), clang_getCString(clang_getTypeSpelling(ctype)));
		clang_disposeString(str);

		if (doVisitChildren) {
			json jchildren = json::array();
			vd.children = &jchildren;
			vd.indent++;

			// visit children:
			clang_visitChildren(c, visit, client_data);

			vd.indent--;
			(*vd.parent)["children"] = jchildren;
		}

	}

	return CXChildVisit_Continue;//return CXChildVisit_Recurse;
}

int main(int argc, const char ** argv) {


	// The index object is our main interface to libclang
	CXIndex index = clang_createIndex(0, 0);
	// The TU represents an invocation of the compiler, based on a source file:
	const char * args[2] = { "-x", "c++" };
	CXTranslationUnit unit = clang_parseTranslationUnit(
		index,
		"test.h", 
		args, 2, // command line args
		nullptr, 0,
		CXTranslationUnit_None);
	if (!unit) {
		fprintf(stderr, "Unable to parse translation unit. Quitting.\n");
		exit(-1);
	}

	// for f in unit.get_includes(): print '\t'*f.depth, f.include.name

	// // gives the filename

	jdoc["filename"] = clang_getCString(clang_getTranslationUnitSpelling(unit));

	// To traverse the AST of the TU, we need a Cursor:
	CXCursor cursor = clang_getTranslationUnitCursor(unit);

	// visit all the tree starting from the unit root:
	VisitorData vd;
	vd.parent = &jdoc;
	visit(cursor, cursor, &vd);

	clang_disposeTranslationUnit(unit);
	clang_disposeIndex(index);

	printf("JSON: %s", jdoc.dump().c_str());
	return 0;
}