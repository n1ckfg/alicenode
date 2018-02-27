#ifndef AL_PLATFORM_H
#define AL_PLATFORM_H

#ifdef  _MSC_VER
#define AL_WIN
#include <Windows.h>
#define AL_EXPORT __declspec(dllexport)
#endif 

#ifdef __APPLE__
#define AL_OSX
#define AL_EXPORT
#endif

#endif // AL_PLATFORM_H
