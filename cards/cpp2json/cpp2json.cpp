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
#include <clang-c/Documentation.h>
#include <json.hpp>
#include <stdio.h>
#include <stdlib.h>
#include <string> 

// for convenience
using json = nlohmann::json;

CXFile cfile;

struct VisitorData {
	int indent = 0;
	json * container = 0;

};

std::string filetext;

CXChildVisitResult visit (CXCursor c, CXCursor parent, CXClientData client_data) {
	
	auto kind = clang_getCursorKind(c);
	
	//printf("visit %d\n", (int)kind);

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

		if (file != cfile) {
			doVisitChildren = 0;
			return CXChildVisit_Continue;
		}

		//printf("filename %s\n", clang_getCString(clang_getFileName(file)));

		auto str = clang_getCursorKindSpelling(kind);
		//printf("%s%s at line %d:%d to line %d:%d: %s <%s>\n", std::string(vd.indent,'-').c_str(), clang_getCString(str), line, column, line1, column1, clang_getCString(clang_getCursorSpelling(c)), clang_getCString(clang_getTypeSpelling(ctype)));
		clang_disposeString(str);

		/*
		printf("parent old %s\n", jparent.dump().c_str());
		json& jchildren = jparent["children"];
		json jnode = {
			{"kind", clang_getCString(clang_getCursorKindSpelling(kind)) },
			//{"children", json::array() },
		};
		jchildren.push_back(jnode);
		printf("parent new %s\n", jparent.dump().c_str());
		printf("jdoc: %s\n\n", jdoc.dump().c_str());
		*/

		json& jsiblings = (*vd.container);
		json jnode = {
			{"ast", clang_getCString(clang_getCursorKindSpelling(kind)) },
			
			{"loc", { 
				{"begin", { {"line", line}, {"col", column}, {"char", offset} } }, 
				{"end", { {"line", line1}, {"col", column1}, {"char", offset1} } }
			} }
		};

		// check for names:
		const char * name = clang_getCString(clang_getCursorSpelling(c));
		if (strlen(name)) { jnode["name"] = name; }
		
		// check for comments:
		if (clang_isDeclaration(kind)) {
			
			auto comment = clang_Cursor_getParsedComment(c);
			auto commentkind = clang_Comment_getKind(comment);

			if (commentkind) {
				//printf("commentkind %d\n", commentkind);
				/*
					There's quite a bit of parsing of comment types available in clang-c's Documentation.h
					such as params, embedded code, html tags, etc.
					A comment itself can thus be explored as an AST containing these tokens
				*/
				
				// the simplest option:
				auto rawcomment = clang_Cursor_getRawCommentText(c);
				jnode["comment"] = { { "text", clang_getCString(rawcomment) } };
			}
			
			
		}



		// C++ type; may be invalid, unexposed, a built-in like int, float etc, or more
		CXType ctype = clang_getCursorType(c);
		if (ctype.kind) {
			// clang_getCanonicalType
			// clang_isConstQualifiedType
			// clang_isPODType
			jnode["type"] = clang_getCString(clang_getTypeSpelling(ctype));
		}

		switch(kind) {
		case CXCursor_FunctionDecl:
		case CXCursor_CXXMethod: {
			// for a functiondecl 
			// clang_getFunctionTypeCallingConv
			// clang_isFunctionTypeVariadic
			// clang_getResultType
			CXType rtype = clang_getResultType(ctype);
			jnode["type_ret"] = clang_getCString(clang_getTypeSpelling(rtype));
			int nargs = clang_getNumArgTypes(ctype);
			auto args = json::array();
			for (int i=0; i<nargs; i++) {
				CXType atype = clang_getArgType(ctype, i);
				args.push_back(clang_getCString(clang_getTypeSpelling(atype)));
			}
			jnode["type_args"] = args;

			// clang_Cursor_getNumArguments, clang_Cursor_getArgument
			// clang_getCursorResultType

			jnode["mangled_name"] = clang_getCString(clang_Cursor_getMangling(c));
		
		} break;
		case CXCursor_CompoundStmt: {
			if (file == cfile)
			jnode["text"] = filetext.substr(offset, offset1-offset);
			doVisitChildren = false;
		} break;
		case CXCursor_FieldDecl:  {
			jnode["offsetof"] = clang_Cursor_getOffsetOfField(c) / 8;
			//printf("offset %lld \n", clang_Cursor_getOffsetOfField(c));
			//jnode["offsetof"] = clang_Type_getOffsetOf(clang_getCursorType(parent), name) / 8;
			jnode["sizeof"] = clang_Type_getSizeOf(ctype);
			//printf("sizeof %lld \n", clang_Type_getSizeOf(ctype));
		} break;
		case CXCursor_FloatingLiteral:
		case CXCursor_IntegerLiteral: 
		case CXCursor_StringLiteral: 
		case CXCursor_CharacterLiteral: {

			CXEvalResult res = clang_Cursor_Evaluate(c);
			CXEvalResultKind ekind = clang_EvalResult_getKind(res);
			switch (ekind) {
				case CXEval_Int:
					if (clang_Type_getSizeOf(ctype) > sizeof(int)) {
						unsigned u = clang_EvalResult_isUnsignedInt(res);
						jnode["value"] = u ? u : clang_EvalResult_getAsLongLong(res);
					} else {
						unsigned long long u = clang_EvalResult_getAsUnsigned(res);
						jnode["value"] = u ? u : clang_EvalResult_getAsLongLong(res);
					}
					break;				
				case CXEval_Float:
					jnode["value"] = clang_EvalResult_getAsDouble(res);
					break;
				case CXEval_ObjCStrLiteral:
				case CXEval_StrLiteral:
				case CXEval_CFStr: 
				case CXEval_Other:
				default: {
					const char * val = clang_EvalResult_getAsStr(res);
					
					if (val) {
						printf("val %s\n", val);
						jnode["value"] = clang_EvalResult_getAsStr(res);
					}
				} break;
			}
			clang_EvalResult_dispose(res);
		} break;
		default:
		break;

		}

	
		if (doVisitChildren) {
			json jkids = json::array();
			VisitorData vd1;
			vd1.indent = vd.indent+1;
			vd1.container = &jkids;
			clang_visitChildren(c, visit, &vd1);
			if (jkids.size()) {
				jnode["nodes"] = jkids;
			}
		}
		jsiblings.push_back(jnode);
	}

	return CXChildVisit_Continue;//return CXChildVisit_Recurse;
}

int main(int argc, const char ** argv) {

	const char * filename = argv[1] ? argv[1] : "test.h";

	// The TU represents an invocation of the compiler, based on a source file
	// it needs to know what the invocation arguments to the compiler would be:
	/*
	-std=c++11  -DNDEBUG -fno-exceptions -fno-rtti -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -D__STDC_LIMIT_MACROS -stdlib=libc++
	
		char const * args[] = { "-x", "c++", "-std=c++11", " -stdlib=libc++", "-fparse-all-comments", "-D__STDC_CONSTANT_MACROS", "-D__STDC_LIMIT_MACROS", "-I../../include" };
	
	*/
	char const * args[] = { "-v", "-x", "c++", "-std=c++11", "-fparse-all-comments", "-I../../clang/6.0.0/include", "-I../../include" };
	int nargs = sizeof(args)/sizeof(char *);

	// The index object is our main interface to libclang
	CXIndex index = clang_createIndex(0, 0);

	// see http://www.myopictopics.com/?p=368 for example of adding "unsaved files" to the compilation
	
	unsigned parseOptions = CXTranslationUnit_None // see CXTranslationUnit_Flags
  		// | CXTranslationUnit_SkipFunctionBodies 	// uncomment this to skip function bodies
		// | CXTranslationUnit_KeepGoing // don't give up with fatal errors (e.g. missing includes)
		// | CXTranslationUnit_SingleFileParse
		;
	CXTranslationUnit unit = clang_parseTranslationUnit(
		index,
		filename, 
		args, nargs, // command line args
		nullptr, 0, // "unsaved files"
		parseOptions);

	if (!unit) {
		fprintf(stderr, "Unable to parse translation unit. Quitting.\n");
		//exit(-1);
	}

	//printf("parse complete\n");

	// the parse may have produced errors:
	unsigned int numDiagnostics = clang_getNumDiagnostics(unit);
	if (numDiagnostics) {
		// Use clang_getDiagnostic, clang_getDiagnosticSpelling, etc. to get human-readable error messages.
		for ( unsigned int i=0; i < numDiagnostics; i++) {
			CXDiagnostic diag = clang_getDiagnostic(unit, i);
			CXString diagCategory = clang_getDiagnosticCategoryText(diag);
			CXString diagText = clang_getDiagnosticSpelling(diag);
			CXDiagnosticSeverity severity = clang_getDiagnosticSeverity(diag);
			printf( "Diagnostic[%d] - %s(%d)- %s\n", i, clang_getCString(diagCategory), severity, clang_getCString(diagText));
										
			clang_disposeString(diagText);
			clang_disposeString(diagCategory);
			clang_disposeDiagnostic(diag);
		}
	}
	//printf("diagnostics complete\n");

	// To traverse the AST of the TU, we need a Cursor:
	CXCursor cursor = clang_getTranslationUnitCursor(unit);
	cfile = clang_getFile(unit, filename);

	size_t filesize;
	filetext = clang_getFileContents(unit, cfile, &filesize);
	//printf("%s\n", filetext);
	//printf("file read complete\n");

	/*
	CINDEX_LINKAGE CXFile clang_getIncludedFile(CXCursor cursor);
												 */

	// for f in unit.get_includes(): print '\t'*f.depth, f.include.name
	json jdoc = {
	 	{ "ast", clang_getCString(clang_getCursorKindSpelling(clang_getCursorKind(cursor))) },
		{ "filename", clang_getCString(clang_getTranslationUnitSpelling(unit)) },
		{ "nodes", json::array() }
	};
	//printf("json started\n");

	// visit all the tree starting from the unit root:
	VisitorData vd;
	vd.container = &jdoc["nodes"];
	//printf("begin visit\n");
	clang_visitChildren(cursor, visit, &vd);
	//printf("json complete\n");
	printf("%s\n\n", jdoc.dump(3).c_str());

	clang_disposeTranslationUnit(unit);
	clang_disposeIndex(index);
	return 0;
}