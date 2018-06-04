#ifndef AL_LEAP_H
#define AL_LEAP_H

#include "al_console.h"
#include "al_math.h"

struct LeapMotionData {

    struct Arm {
         glm::vec3 elbowPos;
         glm::vec3 wristPos;
    };

    struct Hand {
        glm::vec3 palmPos;
    };

    struct Pointable {
         glm::vec3 pointablePos;
    };

    // left, right
    Hand hands[2];
    Arm arms[2];
    // fingers
    Pointable pointables[5];
};

#ifdef AL_WIN
#define AL_LEAP_SUPPORTED 1
#include "leap/LeapC.h"
#include "leap/Leap.h"

glm::vec3 toGLM(Leap::Vector v) {
    return glm::vec3(v.x, v.y, v.z);
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
        console.log("Leap connected!!!!!!!");
        //controller.addListener(Listener);

        controller.setPolicy(Leap::Controller::POLICY_BACKGROUND_FRAMES);
        controller.enableGesture(Leap::Gesture::TYPE_SWIPE);
        controller.config().setFloat("Gesture.Swipe.MinLength", 200.0);
        controller.config().save();
    }

    virtual void onDisconnect(const Leap::Controller&) {
        console.log("Leap disconnected");
    }

    virtual void onFrame(const Leap::Controller&) {
        Leap::Frame frame = controller.frame();

        //Get Hands
       // Leap::HandList hands = frame.hands();
        Leap::Hand handR = frame.hands().rightmost();
        Leap::Hand handL = frame.hands().leftmost();
        hands[1].palmPos = toGLM(handR.palmPosition());
        hands[0].palmPos = toGLM(handL.palmPosition());

        //Leap::Vector position = hand.palmPosition();
        //Leap::Vector velocity = hand.palmVelocity();
        //Leap::Vector direction = hand.direction();
        //printf("onFrame %f\n", position.x);

        //Get Fingers
        Leap::Pointable pointableOne = frame.pointables().frontmost();
        pointables[0].pointablePos = toGLM(pointableOne.tipPosition());
        //Leap::Vector position = pointable.tipPosition();
        /*
        if (pointable.isTool()) {
        Leap::Tool tool = Leap::Tool(pointable);
        } else {
            Leap::Finger finger = Leap::Finger(pointable);
        }*/

        //Leap::FingerList fingers = frame.fingers();
        //Leap::Finger mostForwardOnHand = frame.hands()[0].fingers().frontmost();
       
        //fingers[0].fingerPos = toGLM(mostForwardOnHand.tipPosition()); 

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

        /*
        fingers = frame.hands()[0].fingers();
        for(Leap::FingerList::const_iterator fl = fingers.begin(); fl != fingers.end(); fl++){
        Leap::Bone bone;
        Leap::Bone::Type boneType;
        
            for(int b = 0; b < 4; b++)
            {
                boneType = static_cast<Leap::Bone::Type>(b);
                bone = (*fl).bone(boneType);
                std::cout << "Finger index: " << (*fl).type() << " " << bone << std::endl;
            }
        }*/

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