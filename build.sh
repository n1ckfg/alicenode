clang++ -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -Iinclude -Iinclude/uv src/alice.cpp lib/osx/libglfw3.a lib/osx/libuv.a -framework Cocoa -framework IOKit -framework CoreFoundation -framework CoreVideo -o alice

node start.js