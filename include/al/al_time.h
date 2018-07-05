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

struct Timer {
	std::chrono::steady_clock::time_point last;

	Timer() {
		last = std::chrono::steady_clock::now();
	}

	// no. seconds since the last measure
	double measure(bool reset=true) {
		std::chrono::steady_clock::time_point t1 = std::chrono::steady_clock::now();
		std::chrono::steady_clock::duration dur = t1-last;
		double elapsed = 1e-9*(std::chrono::duration_cast<std::chrono::nanoseconds>(dur).count());
		if (reset) last = t1;
		return elapsed;
	}
};


struct FPS {
	// last time point that we measured:
	std::chrono::steady_clock::time_point last;
	// last time point that we woke from sleep:
	std::chrono::steady_clock::time_point woke;

	// the time we want to pass between frames:
	double dtIdeal;
	// the time that actually passed between frames:
	double dtActual; 
	// a running average of it:
	double dt;
	// the sub-duration we were actually working for:
	double dtWorked; 
	
	// what FPS we would actually like to have
	double fpsIdeal = 30.; 
	// the actual last measurement taken
	double fpsActual;
	// the running average of FPS
	double fps;
	// how fast it could potentially run (with no sleeps)
	double fpsPotential;

	// closer to 0, the more averaged the fps will be
	// closer to 1, the more actual the fps will be
	double fpsAccuracy = 0.1;
	// the number of measurements taken since reset()
	int64_t count = 0; 
	
	
	FPS(double fpsIdeal=30.) : fpsIdeal(fpsIdeal) {
		reset();
	}

	void reset() {
		fps = fpsActual = fpsPotential = fpsIdeal;
		dt = dtWorked = dtActual = dtIdeal = 1./fpsIdeal;
		last = std::chrono::steady_clock::now();
		count = 0;
	}

	void setFPS(double f) {
		fpsIdeal = f;
		dtIdeal = 1./fpsIdeal;
	}

	// mark a frame boundary, and update the count and fps estimates accordingly
	// if dosleep is true, the thread will sleep to throttle to the desired frame rate
	void frame(bool dosleep = true) {
		std::chrono::steady_clock::time_point t1 = std::chrono::steady_clock::now();

		// get dt:
		dtActual = 1e-9*(std::chrono::duration_cast<std::chrono::nanoseconds>(t1-last).count());
		dtWorked = 1e-9*(std::chrono::duration_cast<std::chrono::nanoseconds>(t1-woke).count());
		
		// throttle FPS?
		double surplus = dtIdeal - dtWorked;
		if (dosleep && surplus > 0) {
			al_sleep(surplus);
			// measure actual work-time from now, to exclude sleep:
			woke = std::chrono::steady_clock::now();
		} else {
			woke = t1;
		}

		// update state:
		fpsActual = 1./dtActual;
		fps += fpsAccuracy * (fpsActual - fps);
		dt = 1./fps;
		fpsPotential += fpsAccuracy * ((1./dtWorked) - fpsPotential);
		last = t1;
		count++;
	}
};

#endif //AL_TIME_H
