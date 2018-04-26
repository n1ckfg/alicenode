#ifndef ALICE_H
#define ALICE_H

#include "al/al_signals.h"

struct AL_ALICE_EXPORT Alice {
	
	vdk::signal<void()> onReset;
	vdk::signal<void(uint32_t, uint32_t)> onFrame;
	vdk::signal<void()> onReloadGPU;
	
	double t = 0.;	  		// clock time
	double simTime = 0.; 	// simulation time
	double dt = 1/60.; 		// updated continually while running
	double desiredFrameRate = 60.;
	double fpsAvg = 30;	
	int framecount = 0;

	int isSimulating = true;

	
	CloudDevice cloudDevice;
	
	static Alice& Instance();	
	
};

#endif //ALICE_H 