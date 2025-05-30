#include <iostream>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <thread>
#include <vector>
#include <mutex>

#ifdef __APPLE__
    #include <OpenGL/gl.h>
#else
    #include <GL/gl.h>
#endif

#include "source/camera.h"
#include "source/shader.h"
#include "source/scene.h"
#include "source/grid.h"
#include "source/utils.h"
#include "source/raytracer/ray.h"
#include "source/raytracer/hittable_list.h"
#include "source/raytracer/material.h"
#include "source/3d/sphere.h"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "thirdparty/stb_image_write.h"

// Mutex for thread-safe console output
std::mutex console_mutex;

double mouseX = 0.0, clickReleaseX = 0.0;
double mouseY = 0.0, clickReleaseY = 0.0;
bool isMouseClicked = false;
bool keyReset = false;

// timing
float deltaTime = 0.0f;	// time between current frame and last frame
float lastFrame = 0.0f;
bool  firstMouse = true;
bool isMouseCameraActive = false;

Camera* g_camera;


const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

float lastX = SCR_WIDTH / 2.0f;
float lastY = SCR_HEIGHT / 2.0f;


void processInput(GLFWwindow* window) {
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
        g_camera->process_keyboard(FORWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
        g_camera->process_keyboard(BACKWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
        g_camera->process_keyboard(LEFT, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
        g_camera->process_keyboard(RIGHT, deltaTime);
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
    glViewport(0, 0, width, height);
}

void mouse_callback(GLFWwindow* window, double xpos, double ypos) {
    if (firstMouse) {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos; // reversed since y-coordinates go from bottom to top

    lastX = xpos;
    lastY = ypos;

    g_camera->process_mouse_movement(xoffset, yoffset);
}

void scroll_callback(GLFWwindow* window, double xoffset, double yoffset) {
    g_camera->process_mouse_scroll(yoffset);
}

void mouseButtonCallback(GLFWwindow* window, int button, int action, int mods) {
    // mouse left click
    if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS) {
        screenToWorldUsingDepthBuffer(window, SCR_WIDTH, SCR_HEIGHT, g_camera);
    } else if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_RELEASE) {
        std::cout << "left click release" << std::endl;
    }
}


const int ROW = 10;
const int COL = 10;
const float REST_DISTANCE = 0.5f;
const float GRAVITY = -0.05f;

glm::vec3 color(const Ray& ray, const HittableList& world, int depth) {
    std::vector<HitRecord> hitRecords = world.hit(ray);
    if (!hitRecords.empty()) {
        Ray scatteredRay;
        glm::vec3 attenuation;
        if (depth < 50 && hitRecords[0].mat_ptr->scatter(ray, hitRecords[0], attenuation, scatteredRay)) {
            return attenuation * color(scatteredRay, world, depth + 1);
        } else {
            return glm::vec3(0.0f);
        }
    } else {
        glm::vec3 rayDirection = ray.getDirection();
        rayDirection = glm::normalize(rayDirection);
        float t = 0.5f * (rayDirection.y + 1.0f);
        return (1.0f - t) * glm::vec3(1.0f, 1.0f, 1.0f) + t * glm::vec3(0.5f, 0.7f, 1.0f);
    }
};

HittableList *random_scene() {
    HittableList world;
    world.add(std::make_shared<Sphere>(glm::vec3(0, -1000, 0), 1000, new Lambertian(glm::vec3(0.5f, 0.5f, 0.5f))));
    for (int a = -11; a < 11; a++) {
        for (int b = -11; b < 11; b++) {
            float choose_mat = drand48();
            glm::vec3 center(a + 0.9f * drand48(), 0.2f, b + 0.9f * drand48());
            if (glm::length(center - glm::vec3(4, 0.2f, 0)) > 0.9f) {
                if (choose_mat < 0.8f) { // diffuse
                    world.add(std::make_shared<Sphere>(center, 0.2f, new Lambertian(glm::vec3(drand48() * drand48(), drand48() * drand48(), drand48() * drand48()))));
                } else if (choose_mat < 0.95f) { // metal
                    world.add(std::make_shared<Sphere>(center, 0.2f, new Metal(glm::vec3(0.5f * (1 + drand48()), 0.5f * (1 + drand48()), 0.5f * (1 + drand48())), 0.5f * drand48())));
                } else { // glass
                    world.add(std::make_shared<Sphere>(center, 0.2f, new Dielectric(1.5)));
                }
            }
        }
    }
    world.add(std::make_shared<Sphere>(glm::vec3(0, 1, 0), 1.0f, new Dielectric(1.5)));
    world.add(std::make_shared<Sphere>(glm::vec3(-4, 1, 0), 1.0f, new Lambertian(glm::vec3(0.4f, 0.2f, 0.1f))));
    world.add(std::make_shared<Sphere>(glm::vec3(4, 1, 0), 1.0f, new Metal(glm::vec3(
        0.7f, 0.6f, 0.5f), 0.0f)));
    return new HittableList(world);
}

// Function to render a portion of the image
void render_chunk(int start_row, int end_row, int nx, int ny, int ns, unsigned char* image, const HittableList& world) {
    for (int j = start_row; j < end_row; j++) {
        for (int i = 0; i < nx; i++) {
            glm::vec3 col = glm::vec3(0.0f);
            for (int s = 0; s < ns; s++) {
                float u = float(i + drand48()) / (float)nx;
                float v = float(j + drand48()) / (float)ny;
                col += color(g_camera->get_ray(u, v), world, 0);
            }
            col /= (float)ns;
            col = glm::vec3(std::sqrt(col.r), std::sqrt(col.g), std::sqrt(col.b)); // gamma correction
            int index = ((ny - j - 1) * nx + i) * 3;
            image[index] = static_cast<unsigned char>(255.99f * col.r);
            image[index + 1] = static_cast<unsigned char>(255.99f * col.g);
            image[index + 2] = static_cast<unsigned char>(255.99f * col.b);
        }
    }
    std::lock_guard<std::mutex> lock(console_mutex);
    std::cout << "Rendered rows: " << start_row << " to " << end_row << std::endl;
    std::cout.flush();
}

int main(int argc, char** argv) {

    initCanvaGL();

    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "Hello World", NULL, NULL);
    if (window == NULL) {
        std::cout << "Failed to open GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetCursorPosCallback(window, mouse_callback);
    glfwSetScrollCallback(window, scroll_callback);
    glfwSetMouseButtonCallback(window, mouseButtonCallback);

    glewExperimental = true;
    if (glewInit() != GLEW_OK) {
        std::cout << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

	// setup opengl options
	glEnable(GL_DEPTH_TEST);
    glEnable(GL_CULL_FACE);

    glfwSetInputMode(window, GLFW_STICKY_KEYS, GL_TRUE);

    // create program
    Shader* shader = new Shader("shaders/vertex.glsl", "shaders/fragment.glsl");
    assert(glGetError()== GL_NO_ERROR);

    // camera
    g_camera = new Camera(glm::vec3(0.0f, 0.0f, 0.0f));
    g_camera->set_vfov(90.0f);
    g_camera->set_aspect_ratio((float)SCR_WIDTH / (float)SCR_HEIGHT);
    g_camera->update();

    // cosine of PI / 4
    float R = glm::cos(glm::radians(45.0f));
    HittableList world = *random_scene();
    // Create materials
    Lambertian *lambertian1 = new Lambertian(glm::vec3(0.1f, 0.2f, 0.5f));
    Lambertian *lambertian2 = new Lambertian(glm::vec3(0.8f, 0.8f, 0.0f));
    Lambertian *lambertian3 = new Lambertian(glm::vec3(0.0f, 0.0f, 1.0f));
    Lambertian *lambertian4 = new Lambertian(glm::vec3(1.0f, 0.0f, 0.0f));
    Metal *metal1 = new Metal(glm::vec3(0.8f, 0.6f, 0.2f), 1.0f);
    Metal *metal2 = new Metal(glm::vec3(0.8f, 0.8f, 0.8f), 0.3f);
    Dielectric *dielectric = new Dielectric(1.5f);
    Dielectric *glass = new Dielectric(1.5f);

    std::srand(std::time(0)); // Seed for random number generation

    int nx = SCR_WIDTH, ny = SCR_HEIGHT, ns = argc > 1 ? atoi(argv[1]) : 1;
    std::cout << "Number of samples per pixel: " << ns << std::endl;

    unsigned char* image = new unsigned char[nx * ny * 3];
    std::cout << "Rendering image..." << std::endl;

    // Number of threads to use
    const int num_threads = std::thread::hardware_concurrency();
    std::vector<std::thread> threads;
    int rows_per_thread = ny / num_threads;

    std::cout << "Number of threads: " << num_threads << std::endl;
    std::cout << "Rows per thread: " << rows_per_thread << std::endl;

    // Launch threads
    for (int t = 0; t < num_threads; t++) {
        int start_row = t * rows_per_thread;
        int end_row = (t == num_threads - 1) ? ny : start_row + rows_per_thread;
        threads.emplace_back(render_chunk, start_row, end_row, nx, ny, ns, image, std::ref(world));
    }

    // Join threads
    for (auto& thread : threads) {
        thread.join();
    }

    std::cout << "\nRendering complete." << std::endl;

    // Save the image as a PNG file
    stbi_write_png("output.png", nx, ny, 3, image, nx * 3);

    delete[] image;

    // projection and view matrix
    glm::mat4 projection;
    glm::mat4 view;

    float currentFrame;
    assert(glGetError()== GL_NO_ERROR);

    Scene* scene = new Scene();
    assert(glGetError()== GL_NO_ERROR);

    do {

        // per-frame time logic
        currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        processInput(window);
        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // projection and view matrix
        projection = glm::perspective(glm::radians(g_camera->get_zoom()),
         (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 1000.0f);
        view = g_camera->get_view_matrix();
        assert(glGetError()== GL_NO_ERROR);
        scene->render(&projection, &view);

        assert(glGetError()== GL_NO_ERROR);

        glfwSwapBuffers(window);
        glfwPollEvents();
        // std::cout << "GL Error = " << glGetError() << std::endl;
    }
    while (glfwGetKey(window, GLFW_KEY_ESCAPE) != GLFW_PRESS && glfwWindowShouldClose(window) == 0);

    glfwTerminate();

    return 0;
}