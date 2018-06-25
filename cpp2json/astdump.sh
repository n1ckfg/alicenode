
# a quick way to dump the AST of a file:

#clang -Xclang -ast-dump -fsyntax-only test.h
#clang -Xclang -ast-dump -fsyntax-only cpp2json.h
#clang -Xclang -ast-dump -fsyntax-only -fparse-all-comments -Wdocumentation test.h
clang -Xclang -ast-dump -fsyntax-only -fparse-all-comments -Wdocumentation -fno-diagnostics-color test.h