#ifndef AL_LEAP_H
#define AL_LEAP_H

#include "al_console.h"
#include "al_math.h"

struct LeapMotionData {

    struct Arm {
         glm::vec3 elbowPos;
         glm::vec3 wristPos;
    };

    struct Bone {
        glm::vec3 center;
        glm::vec3 direction;
        //glm::mat4 basis;
        float width;
        float boneLength = 0.f;
    };

    struct Finger {
         glm::vec3 tip;
         glm::vec3 direction;
         glm::vec3 velocity;
         float width;
         float length;
         Bone bones[4];
    };

    struct Hand {
        glm::vec3 palmPos;
        glm::vec3 normal;
        glm::vec3 direction;
        glm::vec3 velocity;
        float grab, pinch;
        // fingers
        Finger fingers[5];
    };

    struct Pointable {
         glm::vec3 pointablePos;
    };

    // left, right
    Hand hands[2];
    Arm arms[2];

    bool isConnected = 0;
};

#ifdef AL_WIN
#define AL_LEAP_SUPPORTED 1
#include "leap/LeapC.h"
#include "leap/Leap.h"

glm::vec3 toGLM(Leap::Vector v) {
    //return glm::vec3(v.x, v.y, v.z);
    return glm::vec3(-v.x, -v.z, -v.y);
}

#endif

#ifdef AL_LEAP_SUPPORTED

struct LeapMotion : public LeapMotionData, public Leap::Listener {

    Leap::Controller controller; 
    
    bool connect() {
       controller.addListener(*this);
       return true;
    }

    virtual void onConnect(const Leap::Controller&) {
        console.log("Leap connected");
        //controller.addListener(Listener);
        controller.setPolicy(Leap::Controller::POLICY_BACKGROUND_FRAMES);
        controller.enableGesture(Leap::Gesture::TYPE_SWIPE);
        controller.config().setFloat("Gesture.Swipe.MinLength", 200.0);
        controller.config().save();

        isConnected = true;
    }

    virtual void onDisconnect(const Leap::Controller&) {
        console.log("Leap disconnected");

        isConnected = false;
    }

    virtual void onFrame(const Leap::Controller&) {
        Leap::Frame frame = controller.frame();

        //Get Hands
        Leap::Hand handR = frame.hands().rightmost();
        Leap::Hand handL = frame.hands().leftmost();
        //Hand position
        hands[1].palmPos = toGLM(handR.palmPosition()) * .001f;
        hands[0].palmPos = toGLM(handL.palmPosition()) * .001f;
        //Hand normal
        hands[1].normal = toGLM(handR.palmNormal());
        hands[0].normal = toGLM(handL.palmNormal());
        //Hand direction
        hands[1].direction = toGLM(handR.direction());
        hands[0].direction = toGLM(handL.direction());
        //Hand velocity
        hands[1].velocity = toGLM(handR.palmVelocity()) * .001f;
        hands[0].velocity = toGLM(handL.palmVelocity()) * .001f;
        //Hand grab and pinch strength
        hands[1].grab = handR.grabStrength();
        hands[0].grab = handR.grabStrength();
        hands[1].pinch = handR.pinchStrength();
        hands[0].pinch = handR.pinchStrength();

        //Get Fingers
        Leap::Finger rightForwardFinger = handR.fingers().frontmost();
        Leap::Finger leftForwardFinger = handL.fingers().frontmost();

        //Get Bones on left hand fingers
        Leap::FingerList fingers = frame.hands()[0].fingers();
        auto& outfingers = hands[0].fingers;

        int i=0;
        for(Leap::FingerList::const_iterator fl = fingers.begin(); fl != fingers.end() && i < 5; fl++, i++){
            Leap::Finger finger = *fl;
            
            LeapMotionData::Finger& outfinger = outfingers[i];
            //Tip position
            outfinger.tip = toGLM(finger.tipPosition()) * .001f;
            //Direction
            outfinger.direction = toGLM(finger.direction());
            //Velocity
            outfinger.velocity = toGLM(finger.tipVelocity()) * .001f;
            //width and length
            outfinger.width = finger.width() * .001f;
            outfinger.length = finger.length() * .001f;
        
            for(int b = 0; b < 4; b++)
            { 

                Leap::Bone::Type boneType = static_cast<Leap::Bone::Type>(b);
                Leap::Bone bone = (*fl).bone(boneType);
                LeapMotionData::Bone& outbone = outfinger.bones[b];
                //Bone width length
                outbone.width = bone.width() * .001f;
                outbone.boneLength = bone.length() * .001f;
                //Bone center
                outbone.center = toGLM(bone.center()) * .001f;
                //Bone direction
                outbone.direction = toGLM(bone.direction()) * .001f;

                //std::cout << "Finger index: " << (*fl).type() << " " << bone << std::endl;
               //console.log("finger %d bone %d %f\n", i, b,  hands[0].fingers[i].bones[b].boneLength);
            }
        }

        //Leap::PointableList pointables = frame.pointables();
        //Leap::Pointable pointable = frame.pointables().frontmost();
        //Leap::FingerList fingers = frame.fingers();
        
        Leap::ToolList tools = frame.tools();

        //Get Arm
        Leap::Arm armR = handR.arm();
        Leap::Arm armL = handL.arm();
        arms[1].elbowPos = toGLM(armR.elbowPosition());
        arms[0].elbowPos = toGLM(armR.elbowPosition());
        arms[1].wristPos = toGLM(armR.wristPosition());
        arms[0].wristPos = toGLM(armR.wristPosition());
    
    }

    virtual void onServiceConnect(const Leap::Controller& controller) {
        std::cout << "Service connected " << std::endl;
    }

    virtual void onServiceDisconnect(const Leap::Controller&) {
        std::cout << "Service disconnected " << std::endl;
    }

    virtual void onServiceChange(const Leap::Controller& controller) {
        std::cout << "Service state change " << std::endl;
    }

    /*
    int main(int argc, char** argv) {
        std::cout << "Press Enter to quit, or enter 'p' to pause or unpause the service..." << std::endl;

        bool paused = false;
        while (true) {
            char c = std::cin.get();
            if (c == 'p') {
            paused = !paused;
            controller.setPaused(paused);
            std::cin.get(); //skip the newline
            }
            else
            break;
        }
    }
    */

};

#else 

struct LeapMotion : public LeapMotionData {

    bool connect() {
        return false;
    }
};

#endif


#endif