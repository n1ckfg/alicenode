#include "al/al_console.h"

#include <libfreenect2/libfreenect2.hpp>
#include <libfreenect2/frame_listener_impl.h>
#include <libfreenect2/registration.h>
#include <libfreenect2/packet_pipeline.h>
#include <libfreenect2/logger.h>
#include <signal.h>
#include <chrono>
#include <thread>

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

    signal(SIGINT,sigint_handler);


    pipeline = new libfreenect2::OpenGLPacketPipeline();

    if(freenect2.enumerateDevices() == 0) {
        std::cout << "no device connected!" << std::endl;
        return -1;
    }
    if (serial == "") {
        serial = freenect2.getDefaultDeviceSerialNumber();
    }

/*
    if(pipeline) { 
        dev0 = freenect2.openDevice(serial, pipeline);
    } else {
        dev0 = freenect2.openDevice(serial);
    }*/
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
