#ifndef SPHERE_H
#define SPHERE_H

#include <glm/glm.hpp>
#include "raytracer/ray.h"
#include "raytracer/hittable.h"

class Sphere : public Hittable {
public:
    Sphere(const glm::vec3& center, float radius, Material* material);

    std::vector<HitRecord> hit(const Ray& ray) const override;

    glm::vec3 getCenter() const;
    float getRadius() const;
    Material* getMaterial() const;

private:
    glm::vec3 center;
    float radius;
    Material *material;
};

#endif // SPHERE_H