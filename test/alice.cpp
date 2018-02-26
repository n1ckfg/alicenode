// define this in the "main" file only, to ensure only one implementation
#define GLAD_GL_IMPLEMENTATION
#include "al/al_glfw.h"
#include "al/al_console.h"
#include "al/al_math.h"
#include "al/al_gl.h"

#include "alice.h"

static Alice alice;
    
Alice& Alice::Instance() {
    return alice;
}

Window window;
bool isFullScreen = 0;
bool isThreadsDone = 0;


void glfw_key_callback(GLFWwindow* window_pointer, int keycode, int scancode, int downup, int mods) {
	switch (keycode) { 
	case GLFW_KEY_SPACE: {
		//if (downup) shared.updating = !shared.updating;
	} break;
	case GLFW_KEY_ESCAPE: {
		isThreadsDone = 1;
        glfwSetWindowShouldClose(window_pointer, GL_TRUE);
	} break;
	default:
		console.log("keycode: %d scancode: %d press: %d modifiers: %d", keycode, scancode, downup, mods);
	}
}


extern "C" AL_EXPORT int frame() {
    glfwPollEvents();
    glfwMakeContextCurrent(window.pointer);
    
    glViewport(0, 0, window.width, window.height);
    glEnable(GL_DEPTH_TEST);
    glClearColor(0.f, 0.f, 0.f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    Alice::Instance().onFrame.emit();
    
    glfwSwapBuffers(window.pointer);
    
    double t1 = glfwGetTime();
    alice.dt = t1-alice.t;
    alice.t = t1;
    alice.framecount++;
    
    alice.fpsAvg += 1./alice.dt;
    if (alice.framecount % 60 == 0) {
        //console.log("fps %f", fpsAvg / 60.);
        alice.fpsAvg = 0.;
    }
    
    return !glfwWindowShouldClose(window.pointer);
}


extern "C" AL_EXPORT int setup() {
	console.log("setup");
	console.log("alice alice %p", &alice);

	if (!window.open(isFullScreen)) return -1;
	
	glfwSetKeyCallback(window.pointer, glfw_key_callback);
	
	if (glGetError() != GL_NO_ERROR) {
    	console.error("gl error before loading shader");
	}
	
	alice.t = glfwGetTime();
	
	// run one frame right now
	frame();

    return 0;
}

int main() {

	setup();

    while(frame()) {}

    printf("bye\n");
    return 0;
}