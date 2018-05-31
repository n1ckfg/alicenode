#ifndef AL_LEAP_H
#define AL_LEAP_H

#include "al_console.h"

#include "leap/LeapC.h"
#include "leap/Leap.h"

//using namespace Leap;


struct LeapMotion : public Leap::Listener {

    Leap::Controller controller; 
    
    bool connect() {
       controller.addListener(*this);
       return true;
    }

    virtual void onConnect(const Leap::Controller&) {
        console.log("Leap connected!!!!!!!");
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
        Leap::HandList hands = frame.hands();
        //Leap::Hand hand = frame.hands();
        Leap::Hand hand = frame.hands().rightmost();
        Leap::Vector position = hand.palmPosition();
        Leap::Vector velocity = hand.palmVelocity();
        Leap::Vector direction = hand.direction();

        //Get Fingers
        Leap::PointableList pointables = frame.pointables();
        Leap::Pointable pointable = frame.pointables().frontmost();
        Leap::FingerList fingers = frame.fingers();
        
        Leap::ToolList tools = frame.tools();

        //Get Arm
        //Leap::Arm arm = hand.arm(); 

        if (pointable.isTool()) {
            Leap::Tool tool = Leap::Tool(pointable);
        } else {
            Leap::Finger finger = Leap::Finger(pointable);
        }

        Leap::FingerList fingers = frame.hands()[0].fingers();
        for(Leap::FingerList::const_iterator fl = fingers.begin(); fl != fingers.end(); fl++){
        Leap::Bone bone;
        Leap::Bone::Type boneType;
        
            for(int b = 0; b < 4; b++)
            {
                boneType = static_cast<Leap::Bone::Type>(b);
                bone = (*fl).bone(boneType);
                std::cout << "Finger index: " << (*fl).type() << " " << bone << std::endl;
            }
        }


    }



};


#endif