#include "raytracer/ray.h"
#include <gtest/gtest.h>
#include <glm/vec3.hpp>

TEST(RayTest, DefaultConstructor) {
    Ray ray;
    EXPECT_EQ(ray.getOrigin(), glm::vec3(0.0f, 0.0f, 0.0f));
    EXPECT_EQ(ray.getDirection(), glm::vec3(0.0f, 0.0f, 0.0f));
}

TEST(RayTest, ParameterizedConstructor) {
    glm::vec3 origin(1.0f, 2.0f, 3.0f);
    glm::vec3 direction(4.0f, 5.0f, 6.0f);
    Ray ray(origin, direction);
    EXPECT_EQ(ray.getOrigin(), origin);
    EXPECT_EQ(ray.getDirection(), direction);
}

TEST(RayTest, PointAtParameter) {
    glm::vec3 origin(1.0f, 2.0f, 3.0f);
    glm::vec3 direction(4.0f, 5.0f, 6.0f);
    Ray ray(origin, direction);
    float t = 2.0f;
    glm::vec3 expectedPoint = origin + t * direction;
    EXPECT_EQ(ray.pointAtParameter(t), expectedPoint);
}