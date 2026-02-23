export class ShaderProgram {
  private gl: WebGLRenderingContext;
  public program: WebGLProgram;

  constructor(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;
    const vert = this.compileShader(vertexSource, gl.VERTEX_SHADER);
    const frag = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create GL program');
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error('Program link failed: ' + info);
    }
    this.program = program;
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('Shader compile failed: ' + info);
    }
    return shader;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name: string): WebGLUniformLocation | null {
    return this.gl.getUniformLocation(this.program, name);
  }

  setUniformMatrix4fv(location: WebGLUniformLocation | null, mat: Float32Array) {
    if (!location) return;
    this.gl.uniformMatrix4fv(location, false, mat);
  }

  setUniform4f(location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number) {
    if (!location) return;
    this.gl.uniform4f(location, x, y, z, w);
  }

  dispose(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
