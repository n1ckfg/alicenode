#include "al/al_console.h"

#include <libfreenect2/libfreenect2.hpp>
#include <libfreenect2/frame_listener_impl.h>
#include <libfreenect2/registration.h>
#include <libfreenect2/packet_pipeline.h>
#include <libfreenect2/logger.h>

#include "flextGL.h"
#include <GLFW/glfw3.h>

#include "viewer.h"

#include <signal.h>
#include <chrono>
#include <thread>


Viewer::Viewer() : shader_folder("src/shader/"), 
                   win_width(600),
                   win_height(400)
{
}

static void glfwErrorCallback(int error, const char* description)
{
  std::cerr << "GLFW error " << error << " " << description << std::endl;
}

void Viewer::initialize()
{
    // init glfw - if already initialized nothing happens
    glfwInit();

    GLFWerrorfun prev_func = glfwSetErrorCallback(glfwErrorCallback);
    if (prev_func)
      glfwSetErrorCallback(prev_func);

    // setup context
    glfwDefaultWindowHints();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
#ifdef __APPLE__
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#else
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_ANY_PROFILE);
#endif
    //glfwWindowHint(GLFW_VISIBLE, debug ? GL_TRUE : GL_FALSE);

    window = glfwCreateWindow(win_width*2, win_height*2, "Viewer (press ESC to exit)", 0, NULL);
    if (window == NULL)
    {
        std::cerr << "Failed to create opengl window." << std::endl;
        exit(-1);
    }

    glfwMakeContextCurrent(window);
    OpenGLBindings *b = new OpenGLBindings();
    flextInit(b);
    gl(b);

    std::string vertexshadersrc = ""
        "#version 330\n"
                                                
        "in vec2 Position;"
        "in vec2 TexCoord;"
                    
        "out VertexData{"
        "vec2 TexCoord;" 
        "} VertexOut;"  
                    
        "void main(void)"
        "{"
        "    gl_Position = vec4(Position, 0.0, 1.0);"
        "    VertexOut.TexCoord = TexCoord;"
        "}";
    std::string grayfragmentshader = ""
        "#version 330\n"
        
        "uniform sampler2DRect Data;"
        
        "vec4 tempColor;"
        "in VertexData{"
        "    vec2 TexCoord;"
        "} FragmentIn;"
        
        "layout(location = 0) out vec4 Color;"
        
        "void main(void)"
        "{"
            "ivec2 uv = ivec2(FragmentIn.TexCoord.x, FragmentIn.TexCoord.y);"
            "tempColor = texelFetch(Data, uv);"
            "Color = vec4(tempColor.x/4500, tempColor.x/4500, tempColor.x/4500, 1);"
        "}";
    std::string fragmentshader = ""
        "#version 330\n"
        
        "uniform sampler2DRect Data;"
        
        "in VertexData{"
        "    vec2 TexCoord;"
        "} FragmentIn;"
       
        "layout(location = 0) out vec4 Color;"
        
        "void main(void)"
        "{"
        "    ivec2 uv = ivec2(FragmentIn.TexCoord.x, FragmentIn.TexCoord.y);"

        "    Color = texelFetch(Data, uv);"
        "}";

    renderShader.setVertexShader(vertexshadersrc);
    renderShader.setFragmentShader(fragmentshader);
    renderShader.build();

    renderGrayShader.setVertexShader(vertexshadersrc);
    renderGrayShader.setFragmentShader(grayfragmentshader);
    renderGrayShader.build();


    glfwSetWindowUserPointer(window, this);
    glfwSetKeyCallback(window, Viewer::key_callbackstatic);
    glfwSetWindowSizeCallback(window, Viewer::winsize_callbackstatic);

    shouldStop = false;
}

void Viewer::winsize_callbackstatic(GLFWwindow* window, int w, int h)
{
    Viewer* viewer = reinterpret_cast<Viewer*>(glfwGetWindowUserPointer(window));
    viewer->winsize_callback(window, w, h);
}

void Viewer::winsize_callback(GLFWwindow* window, int w, int h)
{
    win_width = w/2;
    win_height = h/2;
}

void Viewer::key_callbackstatic(GLFWwindow* window, int key, int scancode, int action, int mods)
{
    Viewer* viewer = reinterpret_cast<Viewer*>(glfwGetWindowUserPointer(window));
    viewer->key_callback(window, key, scancode, action, mods);
}

void Viewer::key_callback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
    if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
        shouldStop = true;
}

void Viewer::onOpenGLBindingsChanged(OpenGLBindings *b)
{
    renderShader.gl(b);
    renderGrayShader.gl(b);
    rgb.gl(b);
    ir.gl(b);
}

bool Viewer::render()
{
    // wipe the drawing surface clear
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    GLint x = 0, y = 0;
    int fb_width, fb_width_half, fb_height, fb_height_half;

    std::map<std::string, libfreenect2::Frame*>::iterator iter;

    for (iter = frames.begin(); iter != frames.end(); ++iter)
    {
        libfreenect2::Frame* frame = iter->second;

        // Using the frame buffer size to account for screens where window.size != framebuffer.size, e.g. retina displays
        glfwGetFramebufferSize(window, &fb_width, &fb_height);
        fb_width_half = (fb_width + 1) / 2;
        fb_height_half = (fb_height + 1) / 2;

        glViewport(x, y, fb_width_half, fb_height_half);
        x += fb_width_half;
        if (x >= (fb_width - 1))
        {
            x = 0;
            y += fb_height_half;
        }

        float w = static_cast<float>(frame->width);
        float h = static_cast<float>(frame->height);

        Vertex bl = { -1.0f, -1.0f, 0.0f, 0.0f };
        Vertex br = { 1.0f, -1.0f, w, 0.0f }; 
        Vertex tl = { -1.0f, 1.0f, 0.0f, h };
        Vertex tr = { 1.0f, 1.0f, w, h };
        Vertex vertices[] = {
            bl, tl, tr, 
            tr, br, bl
        };

        gl()->glGenBuffers(1, &triangle_vbo);
        gl()->glGenVertexArrays(1, &triangle_vao);

        gl()->glBindVertexArray(triangle_vao);
        gl()->glBindBuffer(GL_ARRAY_BUFFER, triangle_vbo);
        gl()->glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

        GLint position_attr = renderShader.getAttributeLocation("Position");
        gl()->glVertexAttribPointer(position_attr, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (GLvoid*)0);
        gl()->glEnableVertexAttribArray(position_attr);

        GLint texcoord_attr = renderShader.getAttributeLocation("TexCoord");
        gl()->glVertexAttribPointer(texcoord_attr, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (GLvoid*)(2 * sizeof(float)));
        gl()->glEnableVertexAttribArray(texcoord_attr);


        if (iter->first == "RGB" || iter->first == "registered")
        {
            renderShader.use();

            rgb.allocate(frame->width, frame->height);
            std::copy(frame->data, frame->data + frame->width * frame->height * frame->bytes_per_pixel, rgb.data);
            rgb.flipY();
            rgb.upload();
            glDrawArrays(GL_TRIANGLES, 0, 6);

            rgb.deallocate();

        }
        else
        {
            renderGrayShader.use();

            ir.allocate(frame->width, frame->height);
            std::copy(frame->data, frame->data + frame->width * frame->height * frame->bytes_per_pixel, ir.data);
            ir.flipY();
            ir.upload();
            glDrawArrays(GL_TRIANGLES, 0, 6);
            ir.deallocate();
        }

        gl()->glDeleteBuffers(1, &triangle_vbo);
        gl()->glDeleteVertexArrays(1, &triangle_vao);
    }

    // put the stuff we've been drawing onto the display
    glfwSwapBuffers(window);
    // update other events like input handling 
    glfwPollEvents();

    return shouldStop || glfwWindowShouldClose(window);
}

void Viewer::addFrame(std::string id, libfreenect2::Frame* frame)
{
    frames[id] = frame;
}


/*
    Must install https://github.com/daynix/UsbDk/releases first


libfreenect2::Freenect2 freenect2;
libfreenect2::Freenect2Device *dev0 = 0;
libfreenect2::Freenect2Device *dev1 = 0;
libfreenect2::PacketPipeline *pipeline = 0;

std::string serial = "";
bool enable_rgb = true;
bool enable_depth = true;
bool kinect_shutdown = false;

std::thread kthread0;

void sigint_handler(int s) {
    kinect_shutdown = true;
}

int kthread0_fun() {
    
    int types = 0;
    if (enable_rgb) types |= libfreenect2::Frame::Color;
    if (enable_depth) types |= libfreenect2::Frame::Ir | libfreenect2::Frame::Depth;
    libfreenect2::SyncMultiFrameListener listener(types);
    libfreenect2::FrameMap frames;
    dev0->setColorFrameListener(&listener);
    dev0->setIrAndDepthFrameListener(&listener);

    if (enable_rgb && enable_depth) {
        if (!dev0->start())
            return -1;
    } else {
        if (!dev0->startStreams(enable_rgb, enable_depth))
            return -1;
    }
    std::cout << "device firmware: " << dev0->getFirmwareVersion() << std::endl;
    std::cout << "device firmware: " << dev1->getFirmwareVersion() << std::endl;

    libfreenect2::Registration* registration = new libfreenect2::Registration(dev0->getIrCameraParams(), dev0->getColorCameraParams());
    libfreenect2::Frame undistorted(512, 424, 4), registered(512, 424, 4);

    size_t framecount = 0;

    while(!kinect_shutdown) {
        if (!listener.waitForNewFrame(frames, 10*1000)) { // 10 sconds
            std::cout << "timeout!" << std::endl;
            return -1;
        }
        libfreenect2::Frame *rgb = frames[libfreenect2::Frame::Color];
        libfreenect2::Frame *ir = frames[libfreenect2::Frame::Ir];
        libfreenect2::Frame *depth = frames[libfreenect2::Frame::Depth];

        if (enable_rgb && enable_depth) {
            registration->apply(rgb, depth, &undistorted, &registered);
        }

        // render...
        console.log(".\n");

        listener.release(frames);
    }

    return 0;
}

int main() {

    printf("ktest!!!\n");

    signal(SIGINT,sigint_handler);


    pipeline = new libfreenect2::OpenGLPacketPipeline();

    if(freenect2.enumerateDevices() == 0) {
        std::cout << "no device connected!" << std::endl;
        return -1;
    }
    if (serial == "") {
        serial = freenect2.getDefaultDeviceSerialNumber();
    }


    //if(pipeline) { 
     //   dev0 = freenect2.openDevice(serial, pipeline);
    //} else {
    //    dev0 = freenect2.openDevice(serial);
    //}
    dev0 = freenect2.openDevice(0);
    dev1 = freenect2.openDevice(1);
    std::cout << "device serial: " << dev0->getSerialNumber() << std::endl;
    std::cout << "device serial: " << dev1->getSerialNumber() << std::endl;

    if(dev0 == 0) {
        std::cout << "failure opening device!" << std::endl;
        return -1;
    }
    if(dev1 == 0) {
        std::cout << "failure opening device!" << std::endl;
        return -1;
    }

    kthread0 = std::thread(kthread0_fun);
    console.log("laucnhed thread");

    //while(!kinect_shutdown) { std::this_thread::sleep_for(std::chrono::milliseconds(10)); }

    kthread0.join();

    dev0->stop();
    dev0->close();
    dev1->stop();
    dev1->close();
    console.log("yo\n");
    return 0;
}
*/