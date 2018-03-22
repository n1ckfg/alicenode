#ifndef AL_THREAD_H
#define AL_THREAD_H

// can use a C++ lib thread?

void al_sleep(double seconds) {
	std::this_thread::sleep_for(std::chrono::seconds(seconds));
}

#endif //AL_THREAD_H
