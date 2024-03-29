<!-- terrain definition -->
# Terrain Rendering
This project renders a terrain using OpenGL. Terrain is computed using fault formation algorithm.
Then FIR filter is applied to the terrain to smoothen the terrain.

## Cam Support
The project includes a camera class that implements a first-person camera. The camera can be moved around the scene using the W, A, S, and D keys, and it can be rotated using the mouse.

## Shader Support
The project uses shaders to control the appearance of the triangle. A vertex shader and a fragment shader are used to calculate the position and color of each vertex. The shaders are written in the OpenGL Shading Language (GLSL) and are passed to the graphics card as part of the program.

## Mouse and Scroll Callback
The project includes mouse and scroll callbacks to allow the user to interact with the triangle. The mouse callbacks allow the user to rotate the camera, and the scroll callbacks allow the user to zoom in and out.

## Keyboard Callback
The project includes a keyboard callback to allow the user to interact with the triangle. The keyboard callbacks allow the user to move the camera around the scene and to exit the program.

To run the project, you will need a C++ compiler and an OpenGl implementation. Once you have these tools, you can build and run the project by following the instructions in the project's README file.

### Create a build directory
    mkdir build
    cd build

### Run CMake to generate makefiles
    cmake ..

### Build the project
    make

### Run the program
    ./Terrain_Rendering
