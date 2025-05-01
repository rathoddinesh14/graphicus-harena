#ifndef __UTILS_H__
#define __UTILS_H__

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <iostream>

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include "fileutils.h"
#include "camera.h"

static glm::vec3 random_in_unit_sphere() {
    while (true) {
        glm::vec3 p = glm::vec3(drand48(), drand48(), drand48()) * 2.0f - glm::vec3(1.0f);
        if (glm::length(p) < 1.0f) {
            return glm::normalize(p);
        }
    }
};

static glm::vec3 reflect(const glm::vec3& v, const glm::vec3& n) {
    return v - 2 * glm::dot(v, n) * n;
}

static bool refract(const glm::vec3& v, const glm::vec3& n, float ni_over_nt, glm::vec3& refracted) {
    glm::vec3 uv = glm::normalize(v);
    float dt = glm::dot(uv, n);
    float discriminant = 1.0f - ni_over_nt * ni_over_nt * (1.0f - dt * dt);
    if (discriminant > 0) {
        refracted = ni_over_nt * (uv - n * dt) - n * sqrt(discriminant);
        return true;
    }
    return false;
}

static float schlick(float cosine, float ref_idx) {
    float r0 = (1 - ref_idx) / (1 + ref_idx);
    r0 = r0 * r0;
    return r0 + (1 - r0) * pow((1 - cosine), 5);
}

static void screenToWorldUsingDepthBuffer(GLFWwindow* window, int SCR_WIDTH, int SCR_HEIGHT, Camera* g_camera) {
    std::cout << "left click" << std::endl;
    double xpos, ypos;
    glfwGetCursorPos(window, &xpos, &ypos);
    std::cout << xpos << " " << ypos << std::endl;

    float winZ = 0;
    glReadPixels(xpos, SCR_HEIGHT - ypos, 1, 1, GL_DEPTH_COMPONENT, GL_FLOAT, &winZ);
    std::cout << "z value: " << winZ << std::endl;

    // unproject
    glm::vec3 objPt = glm::unProject(glm::vec3(xpos, SCR_HEIGHT - ypos, winZ),
        g_camera->get_view_matrix(), 
        glm::perspective(glm::radians(g_camera->get_zoom()),(float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 300.0f),
        glm::vec4(0, 0, SCR_WIDTH, SCR_HEIGHT));

    std::cout << "object space: " << objPt.x << " " << objPt.y << " " << objPt.z << std::endl;
}

static GLuint generateCheckerboardTexture() {
    GLuint texture;
    // Checkerboard pattern size
    const int texWidth = 128;
    const int texHeight = 128;

    // Generate checkerboard pattern data
    GLubyte data[texWidth][texHeight];
    for (int j = 0; j < texWidth; ++j) {
        for (int i = 0; i < texHeight; ++i) {
            data[i][j] = (i<=64 && j<=64 || i>64 && j>64 )?255:0;
        }
    }

    // Generate texture
    glGenTextures(1, &texture);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture);

    // Set texture parameters
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);

    // print gl error
    // std::cout << "GL Error = " << glGetError() << std::endl;
    assert(glGetError()== GL_NO_ERROR);

    // Set maximum anisotropy setting (optional)
    GLfloat maxAnisotropy;
    glGetFloatv(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT, &maxAnisotropy);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);

    assert(glGetError()== GL_NO_ERROR);

    // Set mipmap base and max level
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_BASE_LEVEL, 0);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LEVEL, 4);

    // Allocate texture object
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RED, texWidth, texHeight, 0, GL_RED, GL_UNSIGNED_BYTE, data);

    // Generate mipmaps
    glGenerateMipmap(GL_TEXTURE_2D);

    assert(glGetError()== GL_NO_ERROR);

    // Unbind texture
    glBindTexture(GL_TEXTURE_2D, 0);

    return texture;
}

static GLuint generateCubeMapTexture() {
    GLuint texture;

    int textureWidths[6], textureHeights[6], channels[6];
    GLubyte* imageData[6];
    std::cout << "Loading skybox Images..." << std::endl;
    char const* folder = "/Users/rathod_ias/Downloads/field-skyboxes/FishPond";
    // std::vector<std::string> files = getFilenames(folder);
    std::vector<std::string> files = {
                            std::string(folder) + "/posx.jpg",
                            std::string(folder) + "/negx.jpg", 
                            std::string(folder) + "/posy.jpg", 
                            std::string(folder) + "/negy.jpg", 
                            std::string(folder) + "/posz.jpg", 
                            std::string(folder) + "/negz.jpg"};

    for (int i = 0; i < 6; i++) {
        std::cout << "Loading " << files[i] << std::endl;
        imageData[i] = readImage(files[i].c_str(), textureWidths[i], textureHeights[i], channels[i]);
        if (imageData[i] == NULL) {
            std::cout << "Failed to load image" << std::endl;
        }
        else {
            std::cout << "Loaded image" << std::endl;
        }
    }

    glGenTextures(1, &texture);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_CUBE_MAP, texture);

    // parameters
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    GLint format = channels[0] == 4 ? GL_RGBA : GL_RGB;

    for (int i = 0; i < 6; i++) {
        glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, 
            format, textureWidths[i], textureHeights[i], 0, format, GL_UNSIGNED_BYTE, imageData[i]);

        if (imageData[i] != NULL) {
            // glGenerateMipmap(GL_TEXTURE_CUBE_MAP);
            delete[] imageData[i];
        }
    }
    assert(glGetError()== GL_NO_ERROR);

    return texture;
}

static void initCanvaGL() {
    if (!glfwInit()) {
        std::cout << "Failed to initialize GLFW" << std::endl;
        // exit
        exit(-1);
    }

    // mac os x
    #ifdef __UNIX__
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    #elif __APPLE__
            // Define version and compatibility settings
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
        glfwWindowHint(GLFW_OPENGL_PROFILE,GLFW_OPENGL_CORE_PROFILE);
        glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    #endif
}

#endif