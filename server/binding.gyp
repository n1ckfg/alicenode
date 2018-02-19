{
	"targets": [{
		"target_name": "alice_services",
		"type": "shared_library",
		"sources": [ 
			"alice_services.cpp"
		],
		"include_dirs": [
			"../dependencies/",
			"../dependencies/al/",
			"../dependencies/glad/src", 
			"../dependencies/glfw3/include"
		],
		"cflags": [
			"-Wall", 
			"-std=c++11", 
			'-fexceptions', 
			"-O3"
		],
		'conditions': [
			['OS=="mac"', {
				'defines': [],
				'link_settings': {
					'libraries': [
						'-framework Cocoa',
						'-framework IOKit',
						'-framework CoreFoundation',
						'-framework CoreVideo',
						'-L../../dependencies/glfw3/osx', '-lglfw3'
					]
				},
				'xcode_settings': {
            		"OTHER_CFLAGS": ["-stdlib=libc++"],
					"MACOSX_DEPLOYMENT_TARGET": '10.11',
					"CLANG_CXX_LIBRARY": "libc++",
					'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
				}
			}],
			['OS=="win"', {
				
			}]
		]
	}]
}