clang++ -shared -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -I../dependencies/include alice.cpp -L../dependencies/lib/osx -lglfw3 -framework Cocoa -framework IOKit -framework CoreFoundation -framework CoreVideo -o alice.dylib

# note that it explicitly links to alice.dylib
# on windows it would need to link to alice.lib

clang++ -shared -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -I../dependencies/include sim.cpp -L../dependencies/lib/osx alice.dylib -o sim.dylib

node index.js