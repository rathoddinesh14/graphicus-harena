attribute vec3 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
uniform mat4 u_matrix;

void main() {
  v_texcoord = a_texcoord;
  gl_Position = u_matrix * vec4(a_position, 1.0);
}
