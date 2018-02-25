clang++ -shared -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -I../dependencies/include alice.cpp -L../dependencies/lib/osx -lglfw3 -framework Cocoa -framework IOKit -framework CoreFoundation -framework CoreVideo -o alice.dylib

clang++ -shared -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -I../dependencies/include sim.cpp -L../dependencies/lib/osx  -o sim.dylib

node index.js