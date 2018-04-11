#ifndef AL_TIME_H
#define AL_TIME_H

#include <chrono>
#include <thread>

#include <flicks/flicks.h>


void al_sleep(double seconds) {
	std::this_thread::sleep_for(std::chrono::milliseconds(uint64_t(seconds * 1000.)));
}


#endif //AL_TIME_H
