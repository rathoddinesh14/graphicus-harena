#include "3d/sphere.h"
#include "raytracer/ray.h"
#include <gtest/gtest.h>
#include <glm/glm.hpp>
#include "raytracer/material.h"

TEST(SphereTest, HitTest) {
    glm::vec3 center(0.0f, 0.0f, 0.0f);
    float radius = 1.0f;
    Lambertian lambertianMaterial(glm::vec3(1.0f, 0.0f, 0.0f)); // Diffuse material
    Sphere sphere(center, radius, &lambertianMaterial);

    glm::vec3 origin(0.0f, 0.0f, -3.0f);
    glm::vec3 direction(0.0f, 0.0f, 1.0f);
    Ray ray(origin, direction);

    std::vector<HitRecord> recs = sphere.hit(ray);

    EXPECT_EQ(recs.size(), 2); // Expect two intersection points
    EXPECT_NEAR(recs[0].t, 2.0f, 1e-5);
    EXPECT_EQ(recs[0].p, glm::vec3(0.0f, 0.0f, -1.0f));
    EXPECT_EQ(recs[0].normal, glm::vec3(0.0f, 0.0f, -1.0f));
    EXPECT_EQ(recs[0].mat_ptr, &lambertianMaterial);

    EXPECT_NEAR(recs[1].t, 4.0f, 1e-5);
    EXPECT_EQ(recs[1].p, glm::vec3(0.0f, 0.0f, 1.0f));
    EXPECT_EQ(recs[1].normal, glm::vec3(0.0f, 0.0f, 1.0f));
    EXPECT_EQ(recs[1].mat_ptr, &lambertianMaterial);
}

TEST(SphereTest, NoIntersectionTest) {
    glm::vec3 center(0.0f, 0.0f, 0.0f);
    float radius = 1.0f;
    Lambertian lambertianMaterial(glm::vec3(1.0f, 0.0f, 0.0f)); // Diffuse material
    Sphere sphere(center, radius, &lambertianMaterial);

    glm::vec3 origin(0.0f, 3.0f, -3.0f); // Ray starts far from the sphere
    glm::vec3 direction(0.0f, 0.0f, 1.0f);
    Ray ray(origin, direction);

    std::vector<HitRecord> recs = sphere.hit(ray);

    EXPECT_TRUE(recs.empty()); // Expect no intersection
}

TEST(SphereTest, HitTestWithMetal) {
    glm::vec3 center(0.0f, 0.0f, 0.0f);
    float radius = 1.0f;
    Metal metalMaterial(glm::vec3(0.8f, 0.8f, 0.8f), 0.3f); // Reflective material
    Sphere sphere(center, radius, &metalMaterial);

    glm::vec3 origin(0.0f, 0.0f, -3.0f);
    glm::vec3 direction(0.0f, 0.0f, 1.0f);
    Ray ray(origin, direction);

    std::vector<HitRecord> recs = sphere.hit(ray);

    EXPECT_EQ(recs.size(), 2); // Expect two intersection points
    EXPECT_NEAR(recs[0].t, 2.0f, 1e-5);
    EXPECT_EQ(recs[0].p, glm::vec3(0.0f, 0.0f, -1.0f));
    EXPECT_EQ(recs[0].normal, glm::vec3(0.0f, 0.0f, -1.0f));
    EXPECT_EQ(recs[0].mat_ptr, &metalMaterial);

    EXPECT_NEAR(recs[1].t, 4.0f, 1e-5);
    EXPECT_EQ(recs[1].p, glm::vec3(0.0f, 0.0f, 1.0f));
    EXPECT_EQ(recs[1].normal, glm::vec3(0.0f, 0.0f, 1.0f));
    EXPECT_EQ(recs[1].mat_ptr, &metalMaterial);
}
