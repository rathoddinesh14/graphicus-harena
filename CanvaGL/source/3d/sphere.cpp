#include "sphere.h"

Sphere::Sphere(const glm::vec3& center, float radius, Material* material)
    : center(center), radius(radius), material(material) {}

std::vector<HitRecord> Sphere::hit(const Ray& ray) const {
    std::vector<HitRecord> hitRecords;
    glm::vec3 oc = ray.getOrigin() - center;
    float a = glm::dot(ray.getDirection(), ray.getDirection());
    float b = glm::dot(oc, ray.getDirection());
    float c = glm::dot(oc, oc) - radius * radius;
    float discriminant = b * b - a * c;

    if (discriminant > 0) {
        auto createHitRecord = [&](float t) {
            HitRecord rec;
            rec.t = t;
            rec.p = ray.pointAtParameter(rec.t);
            rec.normal = (rec.p - center) / radius;
            rec.mat_ptr = material;
            return rec;
        };

        float temp = (-b - sqrt(discriminant)) / a;
        hitRecords.push_back(createHitRecord(temp));

        temp = (-b + sqrt(discriminant)) / a;
        hitRecords.push_back(createHitRecord(temp));
    }
    return hitRecords;
}

glm::vec3 Sphere::getCenter() const {
    return center;
}

float Sphere::getRadius() const {
    return radius;
}

Material* Sphere::getMaterial() const {
    return material;
}
