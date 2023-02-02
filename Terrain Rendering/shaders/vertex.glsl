#version 330 core
layout (location = 0) in vec3 aPos;

uniform mat4 view;
uniform mat4 projection;

out vec3 color;

void main() {
    gl_Position = projection * view * vec4(aPos, 1.0);
    color = vec3((aPos.y / 5)*0.5 + 0.1);
}