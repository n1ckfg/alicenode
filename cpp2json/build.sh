clang++ -std=c++11 -O3 -DNDEBUG -fno-exceptions -fno-rtti -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -D__STDC_LIMIT_MACROS -stdlib=libc++ -Iinclude cpp2json.cpp -Wl,-rpath,"." libclang.dylib  -o cpp2json && ./cpp2json ../../alicenode_inhabitat/state.h state.json
#&& cat test.json 
#&& node regen.js test.json
