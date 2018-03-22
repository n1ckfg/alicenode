// define this in the "main" file only, to ensure only one implementation
#define AL_IMPLEMENTATION
#define BUILDING_UV_SHARED

#include "uv/uv.h"
#include "al/al_glfw.h"
#include "al/al_console.h"
#include "al/al_math.h"
#include "al/al_gl.h"
#include "al/al_time.h"


#ifdef AL_WIN
	// Windows
	HMODULE lib_handle = 0;
#else
	// OSX
	#include <dlfcn.h> // dlopen
	//#define USE_UV 1
	void * lib_handle = 0;
#endif

typedef int (*initfun_t)(void);
typedef int (*quitfun_t)(void);

#include "alice.h"

static Alice alice;
    
Alice& Alice::Instance() {
    return alice;
}

Window window;
bool isFullScreen = 0;
bool isThreadsDone = 0;

uv_loop_t uv_main_loop;
uv_pipe_t stdin_pipe;

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


extern "C" AL_ALICE_EXPORT int frame() {

	static float c = 1;

    glfwPollEvents();
    glfwMakeContextCurrent(window.pointer);
    
    glViewport(0, 0, window.width, window.height);
    glEnable(GL_DEPTH_TEST);
    if (0) {
    	glClearColor(c, c, c, 1.0f);
    	c -= 0.1f;
    	if (c <=0.) c = 1.;
    } else {
    	glClearColor(0.f, 0.f, 0.f, 1.0f);
    }
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


extern "C" AL_ALICE_EXPORT int setup() {
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

extern "C" AL_ALICE_EXPORT int closelib(const char * libpath) {
	int res = 0;
	if (lib_handle) {
		quitfun_t quitfun = 0;
		#ifdef AL_WIN
			quitfun = (quitfun_t)GetProcAddress(lib_handle, "onunload");
		#else
			quitfun = (quitfun_t)dlsym(lib_handle, "onunload");
		#endif
		if (quitfun) {
			res = quitfun();
			fprintf(stdout, "onunload result %d\n", res);
		} else {
			fprintf(stderr, "onunload function not found\n");
		}
		
		#ifdef AL_WIN
			if (FreeLibrary(lib_handle) == 0) {
				fprintf(stderr, "%s\n", GetLastErrorAsString());
			}
		#else
			if (dlclose(lib_handle) != 0) {
				fprintf(stderr, "%s\n", dlerror());
			}
		#endif
		lib_handle = 0;
	}
	return res;
}

extern "C" AL_ALICE_EXPORT int openlib(const char * libpath) {
	initfun_t initfun = 0;
	#ifdef AL_WIN
		lib_handle = LoadLibraryA(libpath);
		if (!lib_handle) {
			fprintf(stderr, "failed to load: %s\n", GetLastErrorAsString());
		} else {
			initfun = (initfun_t)GetProcAddress(lib_handle, "onload");
		}
	#else
		lib_handle = dlopen(libpath, RTLD_NOW | RTLD_GLOBAL);
		if (!lib_handle) {
			fprintf(stderr, "failed to load: %s\n", dlerror());
		} else {
			initfun = (initfun_t)dlsym(lib_handle, "onload");
		}
	#endif
	if (initfun) {
		int res = initfun();
		fprintf(stdout, "init result %d\n", res);
		return res;
	}
	return -1;
}

static void alloc_cb(uv_handle_t* handle, size_t suggested_size, uv_buf_t* buf) {
	buf->base = (char *)malloc(suggested_size);
	buf->len = suggested_size;
}

void read_stdin(uv_stream_t* stream, ssize_t nread, const uv_buf_t* buf) {
	printf("read %d bytes\n", (int) nread);
	
	if (nread == UV_EOF) {
		uv_close((uv_handle_t *)&stdin_pipe, NULL);
	} else if (nread > 0) {
	
		// there could be multiple lines of data received
		// need to parse each one in turn
	
		printf("read %d bytes: %s\n", (int) nread, buf->base);
	}
	if (buf->len && buf->base) {
		free(buf->base);
	}
}

int main() {

	int err = uv_loop_init(&uv_main_loop);
	if (err) fprintf(stderr, "uv error %s\n", uv_strerror(err));
	
	uv_pipe_init(&uv_main_loop, &stdin_pipe, 0);
	uv_pipe_open(&stdin_pipe, 0);
	uv_read_start((uv_stream_t *)&stdin_pipe, &alloc_cb, &read_stdin);

	// don't want to buffer the stdio calls -- want them ASAP
	setbuf(stdout, NULL);
	setbuf(stderr, NULL);

	setup();

	//openlib("../project/project.dll");
	
    while(frame()) {
    	//printf("%d\n", alice.framecount);
    	uv_run(&uv_main_loop, UV_RUN_NOWAIT);
    }

	//closelib("../project/project.dll");

	uv_read_stop((uv_stream_t *)&stdin_pipe);
	uv_close((uv_handle_t *)&stdin_pipe, NULL);
	uv_loop_close(&uv_main_loop);

    printf("bye\n");
    return 0;
}