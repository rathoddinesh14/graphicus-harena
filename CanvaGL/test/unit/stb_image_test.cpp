#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#include <gtest/gtest.h>
#include <vector>

TEST(StbImageTest, WritePngImage) {
    const int width = 2;
    const int height = 2;
    const int channels = 3; // RGB

    // Create a simple 2x2 RGB image (red, green, blue, white)
    std::vector<unsigned char> imageData = {
        255, 0, 0,   0, 255, 0,
        0, 0, 255,   255, 255, 255
    };

    const char* filename = "test_image.png";

    // Write the image to a file
    int result = stbi_write_png(filename, width, height, channels, imageData.data(), width * channels);

    // Check if the image was written successfully
    EXPECT_EQ(result, 1);

    // Clean up the test image file
    std::remove(filename);
}