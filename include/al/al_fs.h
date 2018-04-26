#ifndef AL_FS_H
#define AL_FS_H

#include <string>

#include "al_platform.h"

#ifndef AL_FILE_DELIMITER_STR
	#ifdef AL_WIN
		#define AL_FILE_DELIMITER_STR	"\\"
	#else
		#define AL_FILE_DELIMITER_STR	"/"
	#endif
#endif
#define AL_FILE_DELIMITER (AL_FILE_DELIMITER_STR[0])


std::string al_dirname(const std::string path) {
    size_t pos = path.find_last_of(AL_FILE_DELIMITER);
    if(std::string::npos != pos){
        return path.substr(0, pos+1);
    }
    return "." AL_FILE_DELIMITER_STR;
}

#endif // AL_FS_H