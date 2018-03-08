clang++ -shared -O3 -Wall -std=c++11 -stdlib=libc++ -fexceptions -I../dependencies/include sim.cpp -L../dependencies/lib/osx alice.dylib -o sim.dylib
