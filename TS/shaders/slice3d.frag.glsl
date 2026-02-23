precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;

void main() {
  float v = texture2D(u_texture, v_texcoord).r;
  gl_FragColor = vec4(v, v, v, 1.0);
}
