#ifndef RAY_H
#define RAY_H

#include <glm/vec3.hpp>

class Ray {
private:
    glm::vec3 A; // Origin
    glm::vec3 B; // Direction

public:
    // Default constructor
    Ray() : A(glm::vec3()), B(glm::vec3()) {}

    // Constructor with parameters
    Ray(const glm::vec3& a, const glm::vec3& b) : A(a), B(b) {}

    // Get the origin
    glm::vec3 getOrigin() const {
        return A;
    }

    // Get the direction
    glm::vec3 getDirection() const {
        return B;
    }

    // Get the point at a parameter t
    glm::vec3 pointAtParameter(float t) const {
        return A + t * B;
    }
};

#endif // RAY_H