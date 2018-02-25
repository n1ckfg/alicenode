#include "al/al_glfw.h"

double t = 0.;	
double dt = 1/60.;
double fpsAvg = 60;	
int framecount = 0;

Window window;
bool isFullScreen = 0;
bool isThreadsDone = 0;
Shader * shader_test;
unsigned int VAO;
unsigned int VBO;
unsigned int instanceVBO;

float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};

glm::vec2 translations[100];	

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

extern "C" AL_EXPORT int setup() {
	console.log("setup");
	if (!window.open(isFullScreen)) return -1;
	
	glfwSetKeyCallback(window.pointer, glfw_key_callback);
	
	if (glGetError() != GL_NO_ERROR) {
    	console.error("gl error before loading shader");
	}

    shader_test = Shader::fromFiles("test.vert.glsl", "test.frag.glsl");
	if (!shader_test) return 0;
	{
		for (int i=0; i<100; i++) {
			translations[i] = glm::diskRand(1.f);
		}
		
		// define the VAO 
		// (a VAO stores attrib & buffer mappings in a re-usable way)
		glGenVertexArrays(1, &VAO); 
		glBindVertexArray(VAO);
		// define the VBO while VAO is bound:
		glGenBuffers(1, &VBO); 
		glBindBuffer(GL_ARRAY_BUFFER, VBO);  
		glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
		// attr location 
		glEnableVertexAttribArray(0); 
		// set the data layout
		// attr location, element size & type, normalize?, source stride & offset
		glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0); 

		glGenBuffers(1, &instanceVBO);
		glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
		glBufferData(GL_ARRAY_BUFFER, sizeof(glm::vec2) * 100, &translations[0], GL_STATIC_DRAW);
	
		glEnableVertexAttribArray(2);
		// attr location, element size & type, normalize?, source stride & offset
		glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
		glBindBuffer(GL_ARRAY_BUFFER, 0);
		// mark this attrib as being per-instance	
		glVertexAttribDivisor(2, 1);  
	}
	
	t = glfwGetTime();

    return 0;
}

extern "C" AL_EXPORT int frame() {
    glfwPollEvents();
    glfwMakeContextCurrent(window.pointer);
    
    glViewport(0, 0, window.width, window.height);
    glEnable(GL_DEPTH_TEST);
    glClearColor(0.f, 0.f, 0.f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    shader_test->use();
    shader_test->uniform("time", t);
    
    glBindVertexArray(VAO);
    // offset, vertex count
    //glDrawArrays(GL_TRIANGLES, 0, 3);
    // draw 100 instances:
    glDrawArraysInstanced(GL_TRIANGLES, 0, 3, 100);  

    glfwSwapBuffers(window.pointer);
    
    double t1 = glfwGetTime();
    dt = t1-t;
    t = t1;
    framecount++;
    
    fpsAvg += 1./dt;
    if (framecount % 60 == 0) {
        //console.log("fps %f", fpsAvg / 60.);
        fpsAvg = 0.;
    }
    return !glfwWindowShouldClose(window.pointer);
}

int main() {
    setup();

    while(frame()) {}

    printf("bye\n");
    return 0;
}