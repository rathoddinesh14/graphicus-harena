#ifndef HITTABLE_H
#define HITTABLE_H

#include "raytracer/ray.h"
#include <vector>
#include "raytracer/material.h"

class Material;

class Hittable {
public:
    virtual ~Hittable() = default;
    virtual std::vector<HitRecord> hit(const Ray& ray) const = 0;
};

#endif // HITTABLE_H