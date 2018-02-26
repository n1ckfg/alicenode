#ifndef ALICE_H
#define ALICE_H

#include "al/al_signals.h"

struct Alice {
	
	vdk::signal<void()> onFrame;
		
	double t = 0.;	
	double dt = 1/60.;
	double fpsAvg = 60;	
	int framecount = 0;
	
	static Alice& Instance();	
	
};

#endif //ALICE_H 