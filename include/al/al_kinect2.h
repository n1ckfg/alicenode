#ifndef AL_KINECT2_H
#define AL_KINECT2_H

#include "al_math.h"
#include "al_thread.h"
#include "al_time.h"
#include "al_platform.h"

#include <vector>

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

typedef uint16_t DepthPoint;

static const int cDepthWidth = 512;
static const int cDepthHeight = 424;
static const int cColorWidth = 1920;
static const int cColorHeight = 1080;

/*
	Colour and depth frames are stored separately, as they can be received at different rates
	And moreover, the depth data tends to come in at a lower latency than colour (by 0-3 frames)

	Maybe it would be nice to provide an interface to synchronize them, particularly when recording data to disk
	Even for realtime, sometimes it would be preferable to admit more latency to ensure depth/image data correspond
	(That means, picking an older depth frame to match the closest colour frame timestamp)
*/

struct ColourFrame {
	// RGB colour image at full resolution
	ColorPoint color[cColorWidth*cColorHeight];

	int64_t timeStamp;
};

struct CloudFrame {
	// depth data, in mm. bad points will be marked with zeroes.
	uint16_t depth[cDepthWidth*cDepthHeight];
	// depth points mapped to 3D space
	// coordinate system: right-handed (like common OpenGL use)
	// scale: meters
	// origin: the Kinect IR sensor
	// orientation: +Z in front of kinect, +Y above it, and +X away from the RGB camera
	// i.e. RHS oriented looking toward the camera.
	// to re-orient the space from the camera POV, flip sign on X and Z axes. 
	glm::vec3 xyz[cDepthWidth*cDepthHeight];
	// uv texture coordinates for each depth point to pick from the color image 
	glm::vec2 uv[cDepthWidth*cDepthHeight]; 

	//uint64_t pointCount; 
	int64_t timeStamp;
};

struct CloudDevice {
    int use_colour = 1;
	int use_uv = 1;
    int capturing = 1;

	FILE * recordFD;

	int64_t currentDepthFrameTime = 0;
	int64_t currentColorFrameTime = 0;
	int64_t timestampDiff = 0;

	std::thread kinect_thread;
	std::vector<CloudFrame> cloudFrames = std::vector<CloudFrame>(32);
	std::vector<ColourFrame> colourFrames = std::vector<ColourFrame>(32);
	int lastCloudFrame = 0;
	int lastColourFrame = 0;

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

	// the most recently completed frame:
	const CloudFrame& cloudFrame() {
		return cloudFrames[lastCloudFrame];
	}
	// the most recently completed frame:
	const ColourFrame& colourFrame() {
		return colourFrames[lastColourFrame];
	}

	bool isRecording() {
		return recordFD;
	}

	// TODO: work in progress
	bool record(bool enable) {
		if (enable) {
			if (recordFD) return true; // already recording

			std::string filename = "kinect2.bin";
			if (filename.empty()) return false;

			recordFD = fopen(filename.c_str(), "wb");

		} else {
			// I guess this might be bad if currently writing a frame?
			if (recordFD) fclose(recordFD);
			recordFD = 0;
		}
	}

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
		console.log("ready to capture with RGBD device");
		HRESULT hr = S_OK;
		{
			IDepthFrameSource* pDepthFrameSource = NULL;
			IColorFrameSource* pColorFrameSource = NULL;
			{
				hr = device->get_DepthFrameSource(&pDepthFrameSource);
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
				hr = pDepthFrameSource->OpenReader(&m_pDepthFrameReader);
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
			
				hr = device->get_CoordinateMapper(&m_mapper);
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
				hr = m_mapper->SubscribeCoordinateMappingChanged(&m_coordinateMappingChangedEvent); // TODO
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
			}
			if (use_colour) {
				hr = device->get_ColorFrameSource(&pColorFrameSource);
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
				hr = pColorFrameSource->OpenReader(&m_pColorFrameReader);
				if (FAILED(hr)) { console.log("KINECT failed"); return; }
				
			}
			SafeRelease(pDepthFrameSource);
			SafeRelease(pColorFrameSource);
		}

		console.log("starting capture with RGBD device");
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

			// try to grab colour first, since it tends to be laggier
			int nextColourFrame = (lastColourFrame + 1) % colourFrames.size();
			ColourFrame& colourFrame = colourFrames[nextColourFrame];
			if (use_colour) {
				IColorFrame* pColorFrame;
				hr = m_pColorFrameReader->AcquireLatestFrame(&pColorFrame);
				if (SUCCEEDED(hr)) {
					static const int nCells = cColorWidth * cColorHeight;
					RGBQUAD *src = m_rgb_buffer;
					HRESULT hr = pColorFrame->CopyConvertedFrameDataToArray(nCells * sizeof(RGBQUAD), reinterpret_cast<BYTE*>(src), ColorImageFormat_Bgra);
					if (SUCCEEDED(hr)) {
						ColorPoint * dst = colourFrame.color;
						for (int i = 0; i < nCells; ++i) {
							dst[i].r = src[i].rgbRed;
							dst[i].g = src[i].rgbGreen;
							dst[i].b = src[i].rgbBlue;
							//dst[i].a = 255;
							//new_rgb_data = 1;
						}
						hr = pColorFrame->get_RelativeTime(&currentColorFrameTime);
						currentColorFrameTime /= 10000;
						
						// we finished writing, we can now share this as the next frame to read:
						colourFrame.timeStamp = currentColorFrameTime;
						lastColourFrame = nextColourFrame;

						if (isRecording()) {
							fwrite(&colourFrame, sizeof(ColourFrame), 1, recordFD);
						}
						//console.log("at %d colour", currentColorFrameTime);
					}
					SafeRelease(pColorFrame);
				}
			}

			// identify which is the next frame to write into:
			int nextCloudFrame = (lastCloudFrame + 1) % cloudFrames.size();
			CloudFrame& cloudFrame = cloudFrames[nextCloudFrame];
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
				DepthPoint * dst = cloudFrame.depth;
				hr = pDepthFrame->AccessUnderlyingBuffer(&capacity, &src);
				if (SUCCEEDED(hr)) {
					// copy to captureFrame:
					//for (UINT i = 0; i < capacity; i++) { dst[i] = src[i]; }
					memcpy(dst, src, sizeof(uint16_t) * capacity);

					isNewDepthFrame = true;
					pDepthFrame->get_RelativeTime(&currentDepthFrameTime);
					currentDepthFrameTime /= 10000;
				}
				SafeRelease(pDepthFrame);
			}
			if (isNewDepthFrame) {
				// map captureFrame.depth into XYZ space
				hr = m_mapper->MapDepthFrameToCameraSpace(
					cDepthWidth*cDepthHeight, (UINT16 *)cloudFrame.depth,        // Depth frame data and size of depth frame
					cDepthWidth*cDepthHeight, (CameraSpacePoint *)cloudFrame.xyz); // Output CameraSpacePoint array and size
				if (SUCCEEDED(hr)) {
					// figure out the UVs:
					if (use_uv) {
						// TODO dim or dim-1? 
						glm::vec2 uvscale = glm::vec2(1.f / cColorWidth, 1.f / cColorHeight);
						//uint64_t pts = 0;
						// iterate the points to get UVs
						for (UINT i = 0, y = 0; y < cDepthHeight; y++) {
							for (UINT x = 0; x < cDepthWidth; x++, i++) {
								// TODO: add 0.5 for center of pixel?
								//DepthSpacePoint dp = { (float)x, (float)y };
								// TODO: this could be baked, and avoid the double for loop
								DepthSpacePoint dp = { (float)x + 0.5f, (float)y + 0.5f };
								UINT16 depth_mm = cloudFrame.depth[i];
								glm::vec2 uvpt;
								m_mapper->MapDepthPointToColorSpace(dp, depth_mm, (ColorSpacePoint *)(&uvpt));
								cloudFrame.uv[i] = uvpt * uvscale;
								// TODO create an indices table?
								//if (depth_mm > 0) pts++;
							}
						}
						//pointCount = pts;
						//new_uv_data = 1;
					}

				}

				// TODO: create a quick tri mesh here?

				// we finished writing, we can now share this as the next frame to read:
				cloudFrame.timeStamp = currentDepthFrameTime;
				//console.log("at %d depth", currentDepthFrameTime);
				lastCloudFrame = nextCloudFrame;

				if (isRecording()) {
					fwrite(&cloudFrame, sizeof(CloudFrame), 1, recordFD);
				}
			}
			
			if (fps.measure()) {
				console.log("kinect fps %f", fps.fps);
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