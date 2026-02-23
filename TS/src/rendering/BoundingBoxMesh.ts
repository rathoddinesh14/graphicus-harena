export class BoundingBoxMesh {
  private gl: WebGLRenderingContext;
  private buffer: WebGLBuffer | null = null;
  private vertexCount = 0;

  constructor(gl: WebGLRenderingContext, width: number, height: number, depth: number) {
    this.gl = gl;
    this.create(width, height, depth);
  }

  private create(w: number, h: number, d: number) {
    // center the box at origin
    const hw = w / 2;
    const hh = h / 2;
    const hd = d / 2;

    const corners = [
      [-hw, -hh, -hd],
      [hw, -hh, -hd],
      [hw, hh, -hd],
      [-hw, hh, -hd],
      [-hw, -hh, hd],
      [hw, -hh, hd],
      [hw, hh, hd],
      [-hw, hh, hd],
    ];

    // edges as index pairs
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    const verts: number[] = [];
    for (const e of edges) {
      const a = corners[e[0]];
      const b = corners[e[1]];
      verts.push(...a, ...b);
    }

    const arr = new Float32Array(verts);
    this.vertexCount = arr.length / 3;
    const buf = this.gl.createBuffer();
    if (!buf) throw new Error('Failed to create bbox buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, arr, this.gl.STATIC_DRAW);
    this.buffer = buf;
  }

  bind(positionAttribLocation: number) {
    if (!this.buffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.enableVertexAttribArray(positionAttribLocation);
    this.gl.vertexAttribPointer(positionAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
  }

  draw() {
    if (this.vertexCount === 0) return;
    this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
  }

  dispose() {
    if (this.buffer) this.gl.deleteBuffer(this.buffer);
  }
}
