cmake_minimum_required(VERSION 3.2)

# every cmake project should contain project() command
project(HelloWorld 
VERSION 0.1.0
DESCRIPTION "Hello World"
LANGUAGES CXX)

# cmake type 
set(CMAKE_BUILD_TYPE Debug)

# GoogleTest requires at least C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# opengl
find_package(OpenGL REQUIRED)
include_directories(${OPENGL_INCLUDE_DIRS})

# glew
find_package(GLEW REQUIRED)
if(WIN32)
    # If the operating system is Windows, manually set the include directory to the GLEW folder
    set(GLEW_INCLUDE_DIRS "C:/OpenGL/glew-2.1.0/include")
else()
    # Otherwise, use the include directories provided by the GLEW package
    include_directories(${GLEW_INCLUDE_DIRS})
endif()

# glfw
find_package(glfw3 3.3 REQUIRED)
include_directories(${GLFW_INCLUDE_DIRS})

# glm
find_package(glm REQUIRED)
include_directories(${GLM_INCLUDE_DIRS})

# /opt/local/include/SOIL include
include_directories("/opt/local/include/SOIL")
link_directories("/opt/local/lib")

# Define the thirdparty directory
set(THIRDPARTY_DIR ${CMAKE_SOURCE_DIR}/thirdparty)

# Ensure the thirdparty directory exists
file(MAKE_DIRECTORY ${THIRDPARTY_DIR})

# Path to stb_image_write.h
set(STB_IMAGE_WRITE_HEADER ${THIRDPARTY_DIR}/stb_image_write.h)

# Download stb_image_write.h if it doesn't already exist
if(NOT EXISTS ${STB_IMAGE_WRITE_HEADER})
    message(STATUS "Downloading stb_image_write.h...")
    file(DOWNLOAD 
        https://raw.githubusercontent.com/nothings/stb/master/stb_image_write.h
        ${STB_IMAGE_WRITE_HEADER}
        SHOW_PROGRESS
    )
endif()

# Add thirdparty directory to include paths
include_directories(${THIRDPARTY_DIR})

# Add stb_image_write to the HelloWorld executable
add_executable(HelloWorld 
raytracer_main.cpp
source/camera.cpp
source/shader.cpp
source/3d/sphere.cpp)
target_include_directories(HelloWorld PRIVATE thirdparty)

# copy shaders folder to build folder
file(COPY shaders DESTINATION ${CMAKE_CURRENT_BINARY_DIR})

if (APPLE)
    message("APPLE : Build for MacOS")
    add_compile_options(-Wno-deprecated-declarations)
    target_link_libraries(HelloWorld -g glfw GLEW::GLEW "-framework OpenGL" "/opt/local/lib/libSOIL.dylib")
else()
    message("LINUX : Build for Linux")
    target_link_libraries(HelloWorld ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${GLFW_LIBRARIES} ${GLM_LIBRARIES} glfw)
endif()

# freeglut
# find_package(GLUT REQUIRED)
# include_directories(${GLUT_INCLUDE_DIRS})

# ===============================================================================================
include(CTest)
enable_testing()

include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/03597a01ee50ed33e9dfd640b249b4be3799d395.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

file(COPY test/resources DESTINATION ${CMAKE_CURRENT_BINARY_DIR})

# include folder source
include_directories(./source)

add_executable(
  sample_test
  test/unit/sample.cpp
  test/unit/objreadertest.cpp
)
# target_link_libraries(
#   sample_test
#   GTest::gtest_main
#   ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} "-framework OpenGL"}
# )

if (APPLE)
    message("APPLE : Build for MacOS")
    add_compile_options(-Wno-deprecated-declarations)
    target_link_libraries(sample_test -g GTest::gtest_main glfw GLEW::GLEW "-framework OpenGL" "/opt/local/lib/libSOIL.dylib")
else()
    message("LINUX : Build for Linux")
    target_link_libraries(sample_test GTest::gtest_main ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${GLFW_LIBRARIES} ${GLM_LIBRARIES} glfw)
endif()

add_executable(
  ray_test
  test/unit/raytracer/raytest.cpp
)

if (APPLE)
    add_compile_options(-Wno-deprecated-declarations)
    target_link_libraries(ray_test -g GTest::gtest_main glfw GLEW::GLEW "-framework OpenGL" "/opt/local/lib/libSOIL.dylib")
else()
    target_link_libraries(ray_test GTest::gtest_main ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${GLFW_LIBRARIES} ${GLM_LIBRARIES} glfw)
endif()

add_executable(
  stb_image_test
  test/unit/stb_image_test.cpp
)

if (APPLE)
    add_compile_options(-Wno-deprecated-declarations)
    target_link_libraries(stb_image_test -g GTest::gtest_main glfw GLEW::GLEW "-framework OpenGL" "/opt/local/lib/libSOIL.dylib")
else()
    target_link_libraries(stb_image_test GTest::gtest_main ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${GLFW_LIBRARIES} ${GLM_LIBRARIES} glfw)
endif()

add_executable(
  sphere_test
  test/unit/raytracer/spheretest.cpp
  source/3d/sphere.cpp
)

if (APPLE)
    add_compile_options(-Wno-deprecated-declarations)
    target_link_libraries(sphere_test -g GTest::gtest_main glfw GLEW::GLEW "-framework OpenGL" "/opt/local/lib/libSOIL.dylib")
else()
    target_link_libraries(sphere_test GTest::gtest_main ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${GLFW_LIBRARIES} ${GLM_LIBRARIES} glfw)
endif()

include(GoogleTest)
gtest_discover_tests(sample_test)
gtest_discover_tests(ray_test)
gtest_discover_tests(stb_image_test)
gtest_discover_tests(sphere_test)

# =============================================================================================

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)