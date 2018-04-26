#ifndef al_kinect2_h
#define al_kinect2_h

#include "al_math.h"
#include "al_thread.h"
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
    int hasColorMap = 0;
    int use_colour = 1;
    int use_depth = 1;
    int capturing = 0;
    std::thread capture_thread;

	CloudFrame captureFrame;

#ifdef AL_USE_KINECT2_SDK
    IKinectSensor * device;
	IMultiSourceFrameReader* m_reader;   // Kinect data source
	ICoordinateMapper* m_mapper;         // Converts between depth, color, and 3d coordinates
	RGBQUAD m_rgb_buffer[cColorWidth * cColorHeight]; // used for internal processing;
#endif

    void open() {
#ifdef AL_USE_KINECT2_SDK
        HRESULT result = 0;

		result = GetDefaultKinectSensor(&device);
		if (result != S_OK) {
			// TODO: get meaningful error string from error code
			console.error("Kinect for Windows could not initialize.");
			return;
		}
		device->get_CoordinateMapper(&m_mapper);

		console.log("got RGBD device");

		hasColorMap = 0;
		long priority = 10; // maybe increase?
        
        capture_thread = std::thread(&CloudDevice::run, this);
#endif
    }

#ifdef AL_USE_KINECT2_SDK
    void run() {
        if (!device) return;

        HRESULT hr = device->Open();
		if (!SUCCEEDED(hr)) {
			console.error("failed to open device");
			return;
		}
		console.log("starting capture with RGBD device");

		DWORD ftypes = 0;
		if (use_colour) ftypes |= FrameSourceTypes::FrameSourceTypes_Color;
		if (use_depth) ftypes |= FrameSourceTypes::FrameSourceTypes_Depth;
		device->OpenMultiSourceFrameReader(ftypes, &m_reader);
		
		capturing = 1;
		while (capturing) {
            IMultiSourceFrame* frame = nullptr;
			IDepthFrame* depthframe = nullptr;
			IDepthFrameReference* depthframeref = nullptr;
			IColorFrame* colorframe = nullptr;
			IColorFrameReference* colorframeref = nullptr;
			HRESULT hr = m_reader->AcquireLatestFrame(&frame);
			if (FAILED(hr)) continue;

            /*
			if (SUCCEEDED(frame->get_FrameDescription(&frameDescription))) {
			frameDescription->get_HorizontalFieldOfView(&this->horizontalFieldOfView));
			frameDescription->get_VerticalFieldOfView(&this->verticalFieldOfView));
			frameDescription->get_DiagonalFieldOfView(&this->diagonalFieldOfView));
			}
			*/
            if (use_colour && SUCCEEDED(frame->get_ColorFrameReference(&colorframeref)) && SUCCEEDED(colorframeref->AcquireFrame(&colorframe))) {
				static const int nCells = cColorWidth * cColorHeight;
				RGBQUAD *src = m_rgb_buffer;
				HRESULT hr = colorframe->CopyConvertedFrameDataToArray(nCells * sizeof(RGBQUAD), reinterpret_cast<BYTE*>(src), ColorImageFormat_Bgra);
				if (SUCCEEDED(hr)) {
					ColorPoint * dst = captureFrame.color;
					for (int i = 0; i < nCells; ++i) {
						dst[i].r = src[i].rgbRed;
						dst[i].g = src[i].rgbGreen;
						dst[i].b = src[i].rgbBlue;
						//dst[i].a = 255;
						//new_rgb_data = 1;
					}
				}
			}
			SafeRelease(colorframe);
			SafeRelease(colorframeref);

			if (use_depth && SUCCEEDED(frame->get_DepthFrameReference(&depthframeref)) && SUCCEEDED(depthframeref->AcquireFrame(&depthframe))) {
				INT64 relativeTime = 0;
				depthframe->get_RelativeTime(&relativeTime);
				UINT capacity;
				UINT16 * src; // depth in mm
				hr = depthframe->AccessUnderlyingBuffer(&capacity, &src);
				if (SUCCEEDED(hr)) {
					DepthPoint * dst = captureFrame.depth;
					// make a local copy of depth:
					for (UINT i = 0; i < capacity; i++) {
						dst[i].d = src[i];
					}
					// done with depth frame already
					SafeRelease(depthframe);
					SafeRelease(depthframeref);

					hr = m_mapper->MapDepthFrameToCameraSpace(
						cDepthWidth*cDepthHeight, (UINT16 *)captureFrame.depth,        // Depth frame data and size of depth frame
						cDepthWidth*cDepthHeight, (CameraSpacePoint *)captureFrame.xyz); // Output CameraSpacePoint array and size
					if (SUCCEEDED(hr)) {
						// now copy the cloud, with transform, filter, etc.
						if (use_colour) {
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
			}
			SafeRelease(depthframe);
			SafeRelease(depthframeref);
        }
        SafeRelease(m_reader);
		
		console.log("ending capture with RGBD device");
    }
#endif

    void close() {
#ifdef AL_USE_KINECT2_SDK
        if (capturing) {
            capturing = 0;
            capture_thread.join();
        }
        if (device) {
			device->Close();
			SafeRelease(device);
		}
#endif
    }
};

#endif // al_kinect2_h