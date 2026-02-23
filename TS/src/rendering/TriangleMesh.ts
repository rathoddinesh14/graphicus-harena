export class TriangleMesh {
  private gl: WebGLRenderingContext;
  private vao: WebGLBuffer | null = null;
  private vertexCount: number = 0;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.create();
  }

  private create() {
    // 3 vertices (x,y)
    const vertices = new Float32Array([
      0.0, 0.5,
      -0.5, -0.5,
      0.5, -0.5
    ]);

    const vbo = this.gl.createBuffer();
    if (!vbo) throw new Error('Failed to create buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.vao = vbo;
    this.vertexCount = 3;
  }

  bind(positionAttribLocation: number) {
    if (!this.vao) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vao);
    this.gl.enableVertexAttribArray(positionAttribLocation);
    this.gl.vertexAttribPointer(positionAttribLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  draw() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
  }

  dispose() {
    if (this.vao) this.gl.deleteBuffer(this.vao);
  }
}
