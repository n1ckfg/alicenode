#ifndef AL_KINECT2_H
#define AL_KINECT2_H

#include "al_math.h"
#include "al_thread.h"
#include "al_time.h"
#include "al_platform.h"

#ifdef AL_WIN
#include <Ole2.h>
typedef OLECHAR* WinStr;

#define AL_USE_KINECT2_SDK 1
#include "kinect.h"

// Safe release for interfaces
template<class Interface>
inline void SafeRelease(Interface *& pInterfaceToRelease)
{
	if (pInterfaceToRelease != NULL)
	{
		pInterfaceToRelease->Release();
		pInterfaceToRelease = NULL;
	}
}
#endif

/*
    We're going to want a cloud source
    this could be from a device stream, or from a disk stream

	one way of doing this is to mmap a hunk of space for streaming the frames into, as a kind of ringbuffer

*/

struct CloudPoint {
    glm::vec3 location;
    glm::vec3 color;
    glm::vec2 texCoord; // the location within the original image
};

struct ColorPoint {
	uint8_t r, g, b;
};
struct DepthPoint {
	uint16_t d; // d is depth
};

static const int cDepthWidth = 512;
static const int cDepthHeight = 424;
static const int cColorWidth = 1920;
static const int cColorHeight = 1080;

struct CloudFrame {
	ColorPoint color[cColorWidth*cColorHeight];
	DepthPoint depth[cDepthWidth*cDepthHeight];
	glm::vec3 xyz[cDepthWidth*cDepthHeight]; // all points, in Kinect camera space
	glm::vec2 uv[cDepthWidth*cDepthHeight]; // all points, in Kinect camera space

	CloudPoint cloud[cDepthWidth*cDepthHeight];
	uint64_t pointCount; // how many CloudPoints are valid
};



struct CloudDevice {
    int use_colour = 1;
	int use_uv = 1;
    int capturing = 0;

	int64_t currentDepthFrameTime = 0;
	int64_t currentColorFrameTime = 0;
	int64_t timestampDiff = 0;

	std::thread kinect_thread;

	CloudFrame captureFrame;

#ifdef AL_USE_KINECT2_SDK
    IKinectSensor * device;
	IMultiSourceFrameReader* m_reader;   // Kinect data source
	IDepthFrameReader* m_pDepthFrameReader;
    IColorFrameReader* m_pColorFrameReader;

	ICoordinateMapper* m_mapper;         // Converts between depth, color, and 3d coordinates
	WAITABLE_HANDLE m_coordinateMappingChangedEvent;

	RGBQUAD m_rgb_buffer[cColorWidth * cColorHeight]; // used for internal processing;
	CameraIntrinsics intrinsics = {};
	/* {
    float FocalLengthX;
    float FocalLengthY;
    float PrincipalPointX;
    float PrincipalPointY;
    float RadialDistortionSecondOrder;
    float RadialDistortionFourthOrder;
    float RadialDistortionSixthOrder;
    }*/
#endif

    bool open() {
#ifdef AL_USE_KINECT2_SDK
        HRESULT result = 0;

		result = GetDefaultKinectSensor(&device);
		if (result != S_OK) {
			// TODO: get meaningful error string from error code
			console.error("Kinect for Windows could not initialize.");
			return false;
		} else {
			HRESULT hr = device->Open();
			if (!SUCCEEDED(hr)) {
				console.error("failed to open device");
				SafeRelease(device);
				return false;
			}
			console.log("got RGBD device");

			long priority = 10; // maybe increase?

			kinect_thread = std::thread(&CloudDevice::run, this);
			return true;
		}
#endif
		return false;
    }

#ifdef AL_USE_KINECT2_SDK
	void run() {
		console.log("starting capture with RGBD device");
		HRESULT hr = S_OK;
		{
			IDepthFrameSource* pDepthFrameSource = NULL;
			IColorFrameSource* pColorFrameSource = NULL;
			{
				hr = device->get_DepthFrameSource(&pDepthFrameSource);
				if (FAILED(hr)) { console.log("failed"); return; }
				hr = pDepthFrameSource->OpenReader(&m_pDepthFrameReader);
				if (FAILED(hr)) { console.log("failed"); return; }
			
				hr = device->get_CoordinateMapper(&m_mapper);
				if (FAILED(hr)) { console.log("failed"); return; }
				hr = m_mapper->SubscribeCoordinateMappingChanged(&m_coordinateMappingChangedEvent); // TODO
				if (FAILED(hr)) { console.log("failed"); return; }
			}
			if (use_colour) {
				hr = device->get_ColorFrameSource(&pColorFrameSource);
				if (FAILED(hr)) { console.log("failed"); return; }
				hr = pColorFrameSource->OpenReader(&m_pColorFrameReader);
				if (FAILED(hr)) { console.log("failed"); return; }
				
			}
			SafeRelease(pDepthFrameSource);
			SafeRelease(pColorFrameSource);
		}

		capturing = 1;
		FPS fps;
		while (capturing) {
			HRESULT hr = S_OK;
		
			if (m_coordinateMappingChangedEvent != NULL &&
            	WAIT_OBJECT_0 == WaitForSingleObject((HANDLE)m_coordinateMappingChangedEvent, 0)) {
				console.log("EVENT: coordinate mapping changed");
				
				m_mapper->GetDepthCameraIntrinsics(&intrinsics);
				float focalLengthX = intrinsics.FocalLengthX / cDepthWidth;
				float focalLengthY = intrinsics.FocalLengthY / cDepthHeight;
				float principalPointX = intrinsics.PrincipalPointX / cDepthWidth;
				float principalPointY = intrinsics.PrincipalPointY / cDepthHeight;
				
				ResetEvent((HANDLE)m_coordinateMappingChangedEvent);
			}

			if (use_colour) {
				IColorFrame* pColorFrame;
				hr = m_pColorFrameReader->AcquireLatestFrame(&pColorFrame);
				if (SUCCEEDED(hr)) {
					static const int nCells = cColorWidth * cColorHeight;
					RGBQUAD *src = m_rgb_buffer;
					HRESULT hr = pColorFrame->CopyConvertedFrameDataToArray(nCells * sizeof(RGBQUAD), reinterpret_cast<BYTE*>(src), ColorImageFormat_Bgra);
					if (SUCCEEDED(hr)) {
						ColorPoint * dst = captureFrame.color;
						for (int i = 0; i < nCells; ++i) {
							dst[i].r = src[i].rgbRed;
							dst[i].g = src[i].rgbGreen;
							dst[i].b = src[i].rgbBlue;
							//dst[i].a = 255;
							//new_rgb_data = 1;
						}
						hr = pColorFrame->get_RelativeTime(&currentColorFrameTime);
						currentColorFrameTime /= 10000;
					}
					SafeRelease(pColorFrame);
				}
			}
		
			bool isNewDepthFrame = false;
			{
				IDepthFrame* pDepthFrame = NULL;
				hr = m_pDepthFrameReader->AcquireLatestFrame(&pDepthFrame);
				if (FAILED(hr)) {
					SafeRelease(pDepthFrame);
					//console.log("failed to acquire depth frame");
					continue; 
				}
				
				UINT capacity;
				UINT16 * src; // depth in mm
				DepthPoint * dst = captureFrame.depth;
				hr = pDepthFrame->AccessUnderlyingBuffer(&capacity, &src);
				if (SUCCEEDED(hr)) {
					// copy to captureFrame:
					for (UINT i = 0; i < capacity; i++) {
						dst[i].d = src[i];
					}
					isNewDepthFrame = true;
					pDepthFrame->get_RelativeTime(&currentDepthFrameTime);
					currentDepthFrameTime /= 10000;
				}
				SafeRelease(pDepthFrame);
			}

			if (isNewDepthFrame) {
				// map captureFrame.depth into XYZ space
				hr = m_mapper->MapDepthFrameToCameraSpace(
					cDepthWidth*cDepthHeight, (UINT16 *)captureFrame.depth,        // Depth frame data and size of depth frame
					cDepthWidth*cDepthHeight, (CameraSpacePoint *)captureFrame.xyz); // Output CameraSpacePoint array and size
				if (SUCCEEDED(hr)) {
					// figure out the UVs:
					if (use_uv) {
						// TODO dim or dim-1? 
						glm::vec2 uvscale = glm::vec2(1.f / cColorWidth, 1.f / cColorHeight);
						// iterate the points to get UVs
						for (UINT i = 0, y = 0; y < cDepthHeight; y++) {
							for (UINT x = 0; x < cDepthWidth; x++, i++) {
								// TODO: add 0.5 for center of pixel?
								//DepthSpacePoint dp = { (float)x, (float)y };
								DepthSpacePoint dp = { (float)x + 0.5f, (float)y + 0.5f };
								UINT16 depth_mm = captureFrame.depth[i].d;
								glm::vec2 uvpt;
								m_mapper->MapDepthPointToColorSpace(dp, depth_mm, (ColorSpacePoint *)(&uvpt));
								captureFrame.uv[i] = uvpt * uvscale;
							}
						}
						//new_uv_data = 1;
					}

				}
			}

			// Check color and depth frame timestamps to ensure they were captured at the same time
			timestampDiff = (currentColorFrameTime - currentDepthFrameTime);

			if (fps.measure()) {
				console.log("kinect fps %f, color-depth drift(ms) %d", fps.fps, timestampDiff);
			}
		}
		console.log("ending capture with RGBD device");
	}
#endif

    void close() {
#ifdef AL_USE_KINECT2_SDK
        if (capturing) {
            capturing = 0;
			kinect_thread.join();
        }
        if (device) {
			device->Close();
			SafeRelease(device);
		}
#endif
    }
};

#endif // AL_KINECT2_H