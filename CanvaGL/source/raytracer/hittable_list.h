#ifndef HITTABLE_LIST_H
#define HITTABLE_LIST_H

#include "raytracer/hittable.h"
#include <memory>
#include <vector>

class HittableList : public Hittable {
public:
    HittableList() = default;
    explicit HittableList(std::shared_ptr<Hittable> object) { add(object); }

    void clear() { objects.clear(); }
    void add(std::shared_ptr<Hittable> object) { objects.push_back(object); }

    std::vector<HitRecord> hit(const Ray& ray) const override {
        std::vector<HitRecord> hits;
        for (const auto& object : objects) {
            auto objectHits = object->hit(ray);
            // filter out hits with negative t values
            for (const auto& hit : objectHits) {
                // ignore hits very near zero
                if (hit.t > 0 && hit.t > 0.001f) {
                    hits.push_back(hit);
                }
            }
        }

        if (!hits.empty()) {
            std::sort(hits.begin(), hits.end(), [](const HitRecord& a, const HitRecord& b) {
                return a.t < b.t;
            });
            hits.resize(1); // Keep only the closest hit
        }

        return hits;
    }

private:
    std::vector<std::shared_ptr<Hittable>> objects;
};

#endif
// HITTABLE_LIST_H