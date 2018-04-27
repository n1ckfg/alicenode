// define this in the "main" file only, to ensure only one implementation
#define AL_IMPLEMENTATION
#define BUILDING_UV_SHARED

#include "uv/uv.h"
#include "al/al_glfw.h"
#include "al/al_console.h"
#include "al/al_math.h"
#include "al/al_gl.h"
#include "al/al_time.h"
#include "al/al_fs.h"
#include "al/al_kinect2.h"

#include <string>

typedef int (*initfun_t)(void);
typedef int (*quitfun_t)(void);

#include "alice.h"

static Alice alice;

Alice& Alice::Instance() {
    return alice;
}

std::string runtime_path;
std::string runtime_support_path;
std::string project_lib_path;

uv_loop_t uv_main_loop;
uv_pipe_t stdin_pipe;

Window window;
bool isFullScreen = 0;
bool isThreadsDone = 0;

#ifdef AL_WIN
	// Windows
	HMODULE lib_handle = 0;
#else
	// OSX
	#include <dlfcn.h> // dlopen
	//#define USE_UV 1
	void * lib_handle = 0;
#endif





void glfw_key_callback(GLFWwindow* window_pointer, int keycode, int scancode, int downup, int mods) {
	Alice& alice = Alice::Instance();
	bool shift = (mods & 1) != 0;
	bool ctrl = (mods & 2) != 0;
	bool alt = (mods & 4) != 0;
	bool cmd = (mods & 8) != 0;
	console.log("keycode: %d scancode: %d press: %d shift %d ctrl %d alt %d cmd %d", keycode, scancode, downup, shift, ctrl, alt, cmd);
	
	switch (keycode) { 
	case GLFW_KEY_SPACE: {
		if (downup) {
			if (shift) {
				// shift-space disables rendering & simulating
				alice.isRendering = alice.isSimulating = false;
				//if (!alice.isRendering) alice.isSimulating = false; // don't simulate if we don't render
			} else {
				// space toggles simulating
				alice.isSimulating = !alice.isSimulating;
				if (alice.isSimulating) {
					alice.isRendering = true; // enabling simulation automatically enables rendering
				}
			}
		}
	} break;
	case GLFW_KEY_DELETE:
	case GLFW_KEY_BACKSPACE: {
		if (downup) {
			console.log("simulation reset");
			alice.onReset.emit();
		}
	} break;
	case GLFW_KEY_ESCAPE: {
		isThreadsDone = 1;
        glfwSetWindowShouldClose(window_pointer, GL_TRUE);
	} break;
	//default:
	}
	
}


extern "C" AL_ALICE_EXPORT int frame() {
	static float c = 1;

	Alice& alice = Alice::Instance();
	double tbegin = glfwGetTime();

    glfwPollEvents();
    glfwMakeContextCurrent(window.pointer); // maybe we want to have a onSim() event before doing this?
     
	if (alice.isRendering) 
    	alice.onFrame.emit(window.width, window.height);
    
    glfwSwapBuffers(window.pointer);
    
    double t1 = glfwGetTime();
    alice.dt = t1-alice.t;
    alice.t = t1;
    alice.framecount++;
	if (alice.isSimulating) alice.simTime += alice.dt;
    
    alice.fpsAvg += 0.01*(1./alice.dt - alice.fpsAvg);
    if (alice.framecount % 60 == 0) {
        console.log("fps %f", alice.fpsAvg);
    }
    
    // do we need to sleep?
    double tframe = t1-tbegin;
    double tsleep = 1./alice.desiredFrameRate - tframe;
    if (tsleep > 0.001) {
    	al_sleep(tsleep);
    }
    return !glfwWindowShouldClose(window.pointer);
}


extern "C" AL_ALICE_EXPORT int setup() {
	
	Alice& alice = Alice::Instance();

	console.log("setup");
	console.log("alice alice %p", &alice);

	if (!window.open(isFullScreen)) return -1;
	
	glfwSetKeyCallback(window.pointer, glfw_key_callback);
	
	if (glGetError() != GL_NO_ERROR) {
    	console.error("gl error before loading shader");
	}
	
	alice.t = glfwGetTime();
	
	// run one frame right now (why?)
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
	
	Alice& alice = Alice::Instance();
	if (nread == UV_EOF) {
		uv_close((uv_handle_t *)&stdin_pipe, NULL);
	} else if (nread > 0) {
	
		// there could be multiple lines of data received
		// need to parse each one in turn
		
		//printf("read %d bytes\n", (int) nread);
		
		ssize_t startidx = 0;
		ssize_t endidx = 0;
		while (endidx < nread) {
			if (buf->base[endidx] == 0) {
				
				std::string msg(buf->base + startidx, endidx-startidx);
				//printf("msg at %d .. %d: %s.\n", (int)startidx, (int)endidx, msg.data());
				
				// TODO: assert complete message by checking buf->base[endidx] == 0?
				
				if (buf->base[endidx] != 0) {
					fprintf(stderr, "message is not null-terminated\n");
				} else {
				
					auto iq = msg.find("?");
					if (iq != std::string::npos) {
						std::string command = msg.substr(0,iq);
						std::string arg = msg.substr(iq+1,nread-iq-1);
						//printf("command: %s arg: %s.\n", command.data(), arg.data());
			
						if (command == "closelib") {
							closelib(arg.data());
						} else if (command == "openlib") {
							openlib(arg.data());
						} else if (command == "reloadgpu") {
							alice.onReloadGPU.emit();
						}
					}
				}
				
				startidx = endidx+1;
			}
			endidx++;
		}
		
	}
	if (buf->len && buf->base) {
		free(buf->base);
	}
}

int main(int argc, char ** argv) {

	// initialize the clock:
	al_now();

	for (int i=0; i<argc; i++) {
		printf("arg %d %s\n", i, argv[i]);
	}

	int err = uv_loop_init(&uv_main_loop);
	if (err) fprintf(stderr, "uv error %s\n", uv_strerror(err));

	// process the args:
	// arg[0] is the path of the runtime
	if (argc > 0) runtime_path = al_dirname(std::string(argv[0]));
#ifdef AL_WIN
	runtime_support_path = runtime_path + "/support/win64";
#else
	runtime_support_path = runtime_path + "/support/osx";
#endif

	{
		// try to load any dlls in the /support folder:
		uv_fs_t scandir_req;
		if (uv_fs_scandir(&uv_main_loop, &scandir_req, runtime_support_path.c_str(), 0, nullptr) < 0) {
			//throw UVException(static_cast<uv_errno_t>(scandir_req.result));
			console.error("error attempting to scan %s", runtime_support_path.c_str());
		} else {
			uv_dirent_t entry;
			while (uv_fs_scandir_next(&scandir_req, &entry) != UV_EOF) {
				std::string libpath(runtime_support_path + '/' + entry.name);
				console.log("loading %s", libpath.c_str());
				#ifdef AL_WIN
					HMODULE lib = LoadLibraryA(libpath.c_str());
					if (!lib) {
						fprintf(stderr, "failed to load: %s\n", GetLastErrorAsString());
					} 
				#else
					void * lib = dlopen(libpath.c_str(), RTLD_NOW | RTLD_GLOBAL);
					if (!lib) {
						fprintf(stderr, "failed to load: %s\n", dlerror());
					}
				#endif
			}
		}
		uv_fs_req_cleanup(&scandir_req);
	}

	alice.hmd = new Hmd;
	alice.cloudDevice = new CloudDevice;

	// arg[1] is the path to the lib
	if (argc > 1) project_lib_path = argv[1];

	uv_pipe_init(&uv_main_loop, &stdin_pipe, 0);
	uv_pipe_open(&stdin_pipe, 0);
	uv_read_start((uv_stream_t *)&stdin_pipe, &alloc_cb, &read_stdin);

	// don't want to buffer the stdio calls -- want them ASAP
	setbuf(stdout, NULL);
	setbuf(stderr, NULL);

	setup();
	
	if (!project_lib_path.empty()) {
		openlib(project_lib_path.c_str());
	}

	console.log("begin rendering");
	
    while(frame()) {
    	//printf("%d\n", alice.framecount);
    	uv_run(&uv_main_loop, UV_RUN_NOWAIT);
    }

	if (!project_lib_path.empty()) {
		closelib(project_lib_path.c_str());
	}

	alice.cloudDevice->close();

	uv_read_stop((uv_stream_t *)&stdin_pipe);
	uv_close((uv_handle_t *)&stdin_pipe, NULL);
	uv_loop_close(&uv_main_loop);

    printf("bye\n");
    return 0;
}