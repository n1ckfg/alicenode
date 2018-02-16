#ifndef AL_PLATFORM_H
#define AL_PLATFORM_H

#ifdef  _MSC_VER
#define AL_WIN
#define STRUCT_ALIGN_BEGIN 
//__declspec(align(8))
#define STRUCT_ALIGN_END
HANDLE console_mutex;
#endif 

#ifdef __APPLE__
#define AL_OSX
#define STRUCT_ALIGN_BEGIN
#define STRUCT_ALIGN_END __attribute__((packed, aligned(8)))
#endif

#endif // AL_PLATFORM_H
