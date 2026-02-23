export class Camera {
  public azimuth = 0; // yaw
  public polar = 0.7; // pitch
  public distance = 3.0;
  public target: [number, number, number] = [0, 0, 0];
  public near = 0.1;
  public far = 1000.0;

  constructor() {}

  // build perspective projection
  private perspective(fovy: number, aspect: number, near: number, far: number) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;

    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;

    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
  }

  private normalize(v: number[]) {
    const len = Math.hypot(...v);
    return v.map((x) => x / len);
  }

  private cross(a: number[], b: number[]) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  private lookAt(eye: number[], center: number[], up: number[]) {
    const z0 = eye[0] - center[0];
    const z1 = eye[1] - center[1];
    const z2 = eye[2] - center[2];
    let z = [z0, z1, z2];
    const lenZ = Math.hypot(...z);
    if (lenZ === 0) z = [0, 0, 1];
    else z = z.map((v) => v / lenZ);

    let x = this.cross(up, z);
    const lenX = Math.hypot(...x);
    if (lenX === 0) x = [1, 0, 0];
    else x = x.map((v) => v / lenX);

    const y = this.cross(z, x);

    const out = new Float32Array(16);
    out[0] = x[0];
    out[1] = y[0];
    out[2] = z[0];
    out[3] = 0;

    out[4] = x[1];
    out[5] = y[1];
    out[6] = z[1];
    out[7] = 0;

    out[8] = x[2];
    out[9] = y[2];
    out[10] = z[2];
    out[11] = 0;

    out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
    out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
    out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
    out[15] = 1;
    return out;
  }

  // multiply 4x4 matrices: a * b
  private multiply(a: Float32Array, b: Float32Array) {
    // Column-major multiplication: out = a * b
    // element (r,c) stored at index c*4 + r
    const out = new Float32Array(16);
    for (let c = 0; c < 4; ++c) {
      for (let r = 0; r < 4; ++r) {
        let sum = 0;
        for (let k = 0; k < 4; ++k) {
          // a_{r,k} is at index k*4 + r ; b_{k,c} is at index c*4 + k
          sum += a[k * 4 + r] * b[c * 4 + k];
        }
        out[c * 4 + r] = sum;
      }
    }
    return out;
  }

  // compute combined projection * view matrix
  getViewProjection(aspect: number) {
    const camX = this.distance * Math.cos(this.polar) * Math.sin(this.azimuth);
    const camY = this.distance * Math.sin(this.polar);
    const camZ = this.distance * Math.cos(this.polar) * Math.cos(this.azimuth);
    const eye = [camX + this.target[0], camY + this.target[1], camZ + this.target[2]];
    const up = [0, 1, 0];

    const proj = this.perspective((45 * Math.PI) / 180, aspect, this.near, this.far);
    const view = this.lookAt(eye, this.target, up);
    return this.multiply(proj, view);
  }
}
