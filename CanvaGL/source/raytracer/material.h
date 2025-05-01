#ifndef MATERIAL_H
#define MATERIAL_H

#include <glm/glm.hpp>
#include "raytracer/ray.h"
#include "../utils.h"

// Forward declaration of Material to avoid circular dependency
class Material;

struct HitRecord
{
    float t;
    glm::vec3 p;
    glm::vec3 normal;
    glm::vec3 color;
    Material *mat_ptr;
};

class Material
{
public:
    virtual ~Material() = default;

    // Scatter method to determine how the material interacts with light
    virtual bool scatter(const Ray &rayIn, const HitRecord &hitRec, glm::vec3 &attenuation, Ray &scattered) const = 0;
};

class Lambertian : public Material
{
public:
    explicit Lambertian(const glm::vec3 &albedo) : albedo(albedo) {}

    bool scatter(const Ray &rayIn, const HitRecord &hitRec, glm::vec3 &attenuation, Ray &scattered) const override
    {
        glm::vec3 scatterDirection = hitRec.normal + random_in_unit_sphere();
        scattered = Ray(hitRec.p, scatterDirection);
        attenuation = albedo;
        return true;
    }

private:
    glm::vec3 albedo; // Diffuse color
};

class Metal : public Material
{
public:
    Metal(const glm::vec3 &albedo, float fuzziness)
        : albedo(albedo), fuzziness(fuzziness < 1 ? fuzziness : 1) {}

    bool scatter(const Ray &rayIn, const HitRecord &hitRec, glm::vec3 &attenuation, Ray &scattered) const override
    {
        glm::vec3 reflected = reflect(glm::normalize(rayIn.getDirection()), hitRec.normal);
        glm::vec3 fuzzedDirection = reflected + fuzziness * random_in_unit_sphere();
        scattered = Ray(hitRec.p, fuzzedDirection);
        attenuation = albedo;
        return glm::dot(scattered.getDirection(), hitRec.normal) > 0;
    }

private:
    glm::vec3 albedo; // Reflective color
    float fuzziness;  // Fuzziness factor for imperfect reflection
};

class Dielectric : public Material
{
public:
    Dielectric(float indexOfRefraction) : ir(indexOfRefraction) {}

    bool scatter(const Ray &rayIn, const HitRecord &hitRec, glm::vec3 &attenuation, Ray &scattered) const override
    {
        attenuation = glm::vec3(1.0f, 1.0f, 1.0f);
        glm::vec3 outwardNormal;
        glm::vec3 reflected = reflect(rayIn.getDirection(), hitRec.normal);
        float niOverNt;
        glm::vec3 refracted;
        float reflectProb;
        float cosine;

        if (glm::dot(rayIn.getDirection(), hitRec.normal) > 0) {
            outwardNormal = -hitRec.normal;
            niOverNt = ir;
            cosine = ir * glm::dot(rayIn.getDirection(), hitRec.normal) / glm::length(rayIn.getDirection());
        } else {
            outwardNormal = hitRec.normal;
            niOverNt = 1.0f / ir;
            cosine = -glm::dot(rayIn.getDirection(), hitRec.normal) / glm::length(rayIn.getDirection());
        }

        if (refract(rayIn.getDirection(), outwardNormal, niOverNt, refracted)) {
            reflectProb = schlick(cosine, ir);
        } else {
            reflectProb = 1.0f;
        }

        if (drand48() < reflectProb) {
            scattered = Ray(hitRec.p, reflected);
        } else {
            scattered = Ray(hitRec.p, refracted);
        }
        return true;
    }
private:
    float ir; // Index of refraction
};

#endif // MATERIAL_H