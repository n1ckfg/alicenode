#ifndef AL_TIME_H
#define AL_TIME_H

#include <chrono>
#include <thread>

#include <flicks/flicks.h>

/*
	C++11 provides 3 clocks for timing

	std::chrono::sytem_clock: Is the system-wide real time clock (wall-clock). The clock has the auxiliary functions to_time_t and from_time_t to convert time points into dates.

	std::chrono::steady_clock:  Provides as only clock the guarantee that you can not adjust it. Therefore, std::chrono::steady_clock is the preferred clock to wait for a time duration or until a time point.

	std::chrono::high_resolution_clock: Is the clock with the highest accuracy but it can be a synonym for the clocks std::chrono::system_clock or std::chrono::steady_clock.
*/


void al_sleep(double seconds) {
	std::this_thread::sleep_for(std::chrono::milliseconds(uint64_t(seconds * 1000.)));
}

// return seconds since start:
double al_now() {
	// use steady_clock as the default, as it is strictly monotonic
	// on the test system, this claims a precision of 0.000001 milliseconds
	// if you want dates, use system_clock
	static std::chrono::steady_clock::time_point start = std::chrono::steady_clock::now();
	return std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::steady_clock::now() - start).count() * 1e-9;
}

struct FPS {
	std::chrono::steady_clock::time_point start, last;

	// the running average of FPS
	double fps = 10.;
	// closer to 0, the more averaged the fps will be
	// closer to 1, the more actual the fps will be
	double fpsAccuracy = 0.1;
	// the actual last measurement taken
	double fpsActual = 10.;

	// the number of measurements taken since reset()
	uint64_t count = 0; 
	
	FPS() {
		reset();
	}

	void reset() {
		start = std::chrono::steady_clock::now();
		last = start;
		count = 0;
	}

	// mark a frame boundary, and update the count and fps estimates accordingly
	// returns true approximately once per second, useful for debug posting
	bool measure() {
		count++;
		std::chrono::steady_clock::time_point t1 = std::chrono::steady_clock::now();
		std::chrono::steady_clock::duration dur = t1-last;
		double dt = 1e-9*(std::chrono::duration_cast<std::chrono::nanoseconds>(dur).count());
		fpsActual = 1./dt;
		fps += fpsAccuracy * (fpsActual - fps);
		last = t1;
		return 0 == (count % int(fps));
	}
};

#endif //AL_TIME_H
