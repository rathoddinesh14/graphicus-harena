#ifndef __CAMERA_H__
#define __CAMERA_H__

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <raytracer/ray.h>

enum Cam_Movement {
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT
};

// Default camera values
// yaw indicates the rotation around the y-axis(vertical)
// negative yaw means the camera is rotated to the left
const float YAW         = -90.0f;
// pitch indicates the rotation around the x-axis(lateral)
const float PITCH       =  0.0f;
const float SPEED       =  2.5f;
const float SENSITIVITY =  0.1f;
const float ZOOM        =  45.0f;


class Camera {
    // camera attributes
    glm::vec3 m_position;
    glm::vec3 m_front;
    glm::vec3 m_up;
    glm::vec3 m_right;
    glm::vec3 m_world_up;
    glm::vec3 lower_left_corner, horizontal, vertical;

    // euler angles
    float m_yaw;
    float m_pitch;

    // camera options
    float m_movement_speed;
    float m_mouse_sensitivity;
    float m_zoom;

    float m_vfov; // vertical field of view
    float m_aspect_ratio; // aspect ratio

    void update_camera_vectors();

public:
    Camera(glm::vec3 position);
    Camera(float pos_x, float pos_y, float pos_z,
           float up_x, float up_y, float up_z,
           float yaw, float pitch);

    glm::mat4 get_view_matrix();

    void process_keyboard(Cam_Movement direction, float delta_time);
    void process_mouse_movement(float x_offset, float y_offset,
                                bool constrain_pitch = true);
    void process_mouse_scroll(float y_offset);

    float get_zoom() const;

    glm::vec3 get_position() const;

    // Add setters and getters for vfov and aspect ratio
    void set_vfov(float vfov) { m_vfov = vfov; }
    float get_vfov() const { return m_vfov; }

    void set_aspect_ratio(float aspect_ratio) { m_aspect_ratio = aspect_ratio; }
    float get_aspect_ratio() const { return m_aspect_ratio; }

    void update() {
        float theta = glm::radians(m_vfov);
        float h = 2.0f * tan(theta / 2.0f);
        float w = h * m_aspect_ratio;
        lower_left_corner = m_position - m_right * (w / 2.0f) - m_up * (h / 2.0f) - m_front;
        horizontal = m_right * w;
        vertical = m_up * h;
    }

    Ray get_ray(float u, float v) {
        return Ray(m_position, lower_left_corner + u * horizontal + v * vertical - m_position);
    }

};

#endif // __CAMERA_H__