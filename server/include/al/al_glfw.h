#ifndef AL_GLFW_H
#define AL_GLFW_H

#include "al_platform.h"
#include "al_gl.h"

#define _GLFW_USE_DWM_SWAP_INTERVAL 1
#include <GLFW/glfw3.h>

#include "al_console.h"

struct Window {

	struct Init {			
		Init() {
			glfwInit();
			glfwSetErrorCallback(glfw_error_callback);
		}
	
		~Init() {
			// Terminates GLFW, clearing any resources allocated by GLFW.
			glfwTerminate();
		}
	
		static void glfw_error_callback(int err, const char* description) {
			console.error("GL Error (%d): %s", err, description);
		}
	};
	
	int monitor_count = 0;
	int width = 1920/2;
	int height = 1280/2;
	GLFWmonitor** monitors = NULL;
	GLFWwindow* pointer = 0; 
	bool isFullScreen = 0;
	
	Window() {
		// ensure the once-only stuff happens properly:
		static Init init;
		
		detect_monitors();
	}
	
	void detect_monitors() {
		monitors = glfwGetMonitors(&monitor_count);
		console.log("%d monitor(s)", monitor_count);
	}
	
	bool open(bool isFullScreen) {
		if (pointer) return true;
		
		// GL context options:
		glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
		glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
		glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	#ifdef AL_OSX
		glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE); 
	#endif
		
		// OS window options:
		GLFWmonitor * monitor = NULL;
		if (isFullScreen) {
			monitor = monitors[monitor_count - 1];
			const GLFWvidmode * lastMonitorMode = glfwGetVideoMode(monitor);
			width = lastMonitorMode->width;
			height = lastMonitorMode->height;	
			
			glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);
			glfwWindowHint(GLFW_MAXIMIZED, GL_TRUE);
			glfwWindowHint(GLFW_AUTO_ICONIFY, GL_FALSE);
		} else {
			glfwWindowHint(GLFW_RESIZABLE, GL_TRUE);
			glfwWindowHint(GLFW_MAXIMIZED, GL_FALSE);
			glfwWindowHint(GLFW_AUTO_ICONIFY, GL_TRUE);
			glfwWindowHint(GLFW_FOCUSED, GL_FALSE); // don't grab focus, it's annoying
		}
		
		// try to create it:
		pointer = glfwCreateWindow(width, height, "alicelib", monitor, NULL);
		if (pointer == NULL) {
			console.error("Failed to create GLFW window");
			return false;
		}
	
		// now initialize:
		glfwMakeContextCurrent(pointer);
		glfwSetWindowUserPointer(pointer, this);	
		glfwSwapInterval(0); // turn off vsync	
		glfwGetFramebufferSize(pointer, &width, &height);
		glfw_framebuffer_size_callback(pointer, width, height);
		glfwSetFramebufferSizeCallback(pointer, glfw_framebuffer_size_callback);
	
		int version = gladLoadGLSimple((GLADsimpleloadproc) glfwGetProcAddress);
		if (version == 0) {
			console.error("Failed to initialize OpenGL context");
			return false;
		} else {
			console.log("Loaded OpenGL %d.%d\n", version / 10, version % 10);
		}

	
		// initialize OpenGL:
		
		/*
		if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
			console.error("Failed to initialize OpenGL context");
			return false;
		} else if (GLVersion.major < 2) {
			console.error("Your system doesn't support OpenGL >= 2!");
			return false;
		}
		*/
		//console.log("GLAD initialized OpenGL %d.%d", GLVersion.major, GLVersion.minor);
		console.log("OpenGL %s, GLSL %s", glGetString(GL_VERSION),
			glGetString(GL_SHADING_LANGUAGE_VERSION));

		// TODO: set up user-level GL resources
		
		return true;
	}
	
	void close() {
		if (!pointer) return;		
		glfwDestroyWindow(pointer);
		// TODO: clean up user-level GL resources
		pointer = NULL;
	}
	
	static void glfw_framebuffer_size_callback(GLFWwindow * pointer, int w, int h) {
		console.log("New framebuffer resolution %dx%d", w, h); 
		auto self = (Window *)glfwGetWindowUserPointer(pointer);
		self->width = w;
		self->height = h;
	}
	
};

#endif // AL_GLFW_H
