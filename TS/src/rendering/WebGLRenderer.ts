import { IWebGLRenderer } from './IRenderer';
import { ShaderProgram } from './ShaderProgram';
import { TriangleMesh } from './TriangleMesh';
import { BoundingBoxMesh } from './BoundingBoxMesh';
import { Camera } from './Camera';
import { MouseController } from './MouseController';
import simpleVert from '../../shaders/simple.vert.glsl';
import simpleFrag from '../../shaders/simple.frag.glsl';
import quadVert from '../../shaders/quad.vert.glsl';
import quadFrag from '../../shaders/quad.frag.glsl';
import sliceVert from '../../shaders/slice3d.vert.glsl';
import sliceFrag from '../../shaders/slice3d.frag.glsl';

export class WebGLRenderer implements IWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: ShaderProgram | null = null;
  private mesh: TriangleMesh | null = null;
  private bboxProgram: ShaderProgram | null = null;
  private bboxMesh: BoundingBoxMesh | null = null;
  private camera: Camera;
  private mouse: MouseController | null = null;
  private animationId: number | null = null;
  private sliceIndices: { axial: number; sagittal: number; coronal: number } = { axial: 0, sagittal: 0, coronal: 0 };
  private sliceTexture: WebGLTexture | null = null;
  private quadProgram: ShaderProgram | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private sliceProgram: ShaderProgram | null = null;
  private slicePosBuffer: WebGLBuffer | null = null;
  private sliceTexBuffer: WebGLBuffer | null = null;
  private volume: any = null;
  private worldDims: { wx: number; wy: number; wz: number; width: number; height: number; depth: number } | null = null;

  constructor(canvas: HTMLCanvasElement, vertexSource: string, fragmentSource: string) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    // enable depth testing so back edges render correctly behind nearer fragments
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.resizeCanvas();
    this.program = new ShaderProgram(gl, vertexSource, fragmentSource);
    this.mesh = new TriangleMesh(gl);
    this.bboxProgram = new ShaderProgram(gl, simpleVert, simpleFrag);
    this.camera = new Camera();
    this.mouse = new MouseController(canvas, this.camera);
    // setup quad program and buffer for fullscreen overlay (kept for fallback)
    this.quadProgram = new ShaderProgram(gl, quadVert, quadFrag);
    const quadVerts = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1,
    ]);
    const qb = this.gl.createBuffer();
    if (!qb) throw new Error('Failed to create quad buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, qb);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVerts, this.gl.STATIC_DRAW);
    this.quadBuffer = qb;

    // slice 3D program + buffers for object-space textured quad
    this.sliceProgram = new ShaderProgram(gl, sliceVert, sliceFrag);
    this.slicePosBuffer = this.gl.createBuffer();
    this.sliceTexBuffer = this.gl.createBuffer();
  }

  setSliceIndices(axial: number, sagittal: number, coronal: number) {
    const prev = { ...this.sliceIndices };
    this.sliceIndices = { axial, sagittal, coronal };
    // determine which axis changed and update that slice texture and mesh
    if (axial !== prev.axial) {
      this.updateSliceTextureFromVolume('axial', axial);
      this.updateSliceMesh('axial', axial);
    } else if (sagittal !== prev.sagittal) {
      this.updateSliceTextureFromVolume('sagittal', sagittal);
      this.updateSliceMesh('sagittal', sagittal);
    } else if (coronal !== prev.coronal) {
      this.updateSliceTextureFromVolume('coronal', coronal);
      this.updateSliceMesh('coronal', coronal);
    }
  }

  private resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr || window.innerWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr || window.innerHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  start(): void {
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  stop(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    if (this.mouse) this.mouse.dispose();
  }

  private render() {
    if (!this.program || !this.mesh) return;
    const gl = this.gl;
    gl.clearColor(0.1, 0.12, 0.15, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // simple triangle rendering (demo)
    // this.program.use();
    // const posLoc = gl.getAttribLocation(this.program.program, 'a_position');
    // this.mesh.bind(posLoc);
    // this.mesh.draw();

    // draw bounding box wireframe if exists
    if (this.bboxMesh && this.bboxProgram) {
      this.bboxProgram.use();
      const colorLoc = this.bboxProgram.getUniformLocation('u_color');
      this.bboxProgram.setUniform4f(colorLoc, 0.9, 0.3, 0.2, 1.0);
      const matLoc = this.bboxProgram.getUniformLocation('u_matrix');
      const aspect = this.canvas.width / Math.max(1, this.canvas.height);
      const mat = this.camera.getViewProjection(aspect);
      this.bboxProgram.setUniformMatrix4fv(matLoc, mat);
      const posLocBox = gl.getAttribLocation(this.bboxProgram.program, 'a_position');
      this.bboxMesh.bind(posLocBox);
      this.bboxMesh.draw();
    }

    // draw selected slice quad in object space (inside bounding box)
    if (this.sliceTexture && this.sliceProgram && this.slicePosBuffer && this.sliceTexBuffer) {
      this.sliceProgram.use();
      const matLoc = this.sliceProgram.getUniformLocation('u_matrix');
      const aspect = this.canvas.width / Math.max(1, this.canvas.height);
      const mat = this.camera.getViewProjection(aspect);
      this.sliceProgram.setUniformMatrix4fv(matLoc, mat);

      const posLoc = this.gl.getAttribLocation(this.sliceProgram.program, 'a_position');
      const tcLoc = this.gl.getAttribLocation(this.sliceProgram.program, 'a_texcoord');

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.slicePosBuffer);
      this.gl.enableVertexAttribArray(posLoc);
      this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sliceTexBuffer);
      this.gl.enableVertexAttribArray(tcLoc);
      this.gl.vertexAttribPointer(tcLoc, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.sliceTexture);
      const texLoc = this.gl.getUniformLocation(this.sliceProgram.program, 'u_texture');
      if (texLoc !== null) this.gl.uniform1i(texLoc, 0);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }
    if (this.program) {
      this.program.dispose();
      this.program = null;
    }
    if (this.bboxMesh) {
      this.bboxMesh.dispose();
      this.bboxMesh = null;
    }
    if (this.bboxProgram) {
      this.bboxProgram.dispose();
      this.bboxProgram = null;
    }
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
      this.quadBuffer = null;
    }
    if (this.slicePosBuffer) {
      this.gl.deleteBuffer(this.slicePosBuffer);
      this.slicePosBuffer = null;
    }
    if (this.sliceTexBuffer) {
      this.gl.deleteBuffer(this.sliceTexBuffer);
      this.sliceTexBuffer = null;
    }
    if (this.sliceTexture) {
      this.gl.deleteTexture(this.sliceTexture);
      this.sliceTexture = null;
    }
    if (this.quadProgram) {
      this.quadProgram.dispose();
      this.quadProgram = null;
    }
    if (this.sliceProgram) {
      this.sliceProgram.dispose();
      this.sliceProgram = null;
    }
    if (this.mouse) {
      this.mouse.dispose();
      this.mouse = null;
    }
  }

  setVolumeDimensions(width: number, height: number, depth: number, spacing: [number, number, number]) {
    // compute world extents using spacing
    const wx = width * spacing[0];
    const wy = height * spacing[1];
    const wz = depth * spacing[2];
    if (this.bboxMesh) this.bboxMesh.dispose();
    this.bboxMesh = new BoundingBoxMesh(this.gl, wx, wy, wz);
    // center camera on volume
    this.camera.target = [0, 0, 0];
    // compute bounding sphere radius and set camera distance and clipping planes
    const radius = Math.sqrt(wx * wx + wy * wy + wz * wz) * 0.5;
    const distance = Math.max(1.0, radius * 2.5);
    this.camera.distance = distance;
    // set near/far based on distance and radius to maximize depth precision
    const near = Math.max(0.01, distance - radius * 4);
    const far = distance + radius * 4;
    this.camera.near = near;
    this.camera.far = Math.max(far, near + 0.1);
    // store world dims for slice mesh computations
    this.worldDims = { wx, wy, wz, width, height, depth };
  }

  setVolume(vol: any) {
    this.volume = vol;
  }

  private updateSliceTextureFromVolume(axis: 'axial' | 'sagittal' | 'coronal', index: number) {
    if (!this.volume) return;
    const slice = this.volume.getSliceUint8(axis, index);
    if (!slice || slice.width === 0) return;
    const gl = this.gl;
    if (!this.sliceTexture) {
      const tex = gl.createTexture();
      if (!tex) return;
      this.sliceTexture = tex;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.sliceTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, slice.width, slice.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, slice.data);
  }

  private updateSliceMesh(axis: 'axial' | 'sagittal' | 'coronal', index: number) {
    if (!this.worldDims) return;
    const { wx, wy, wz, width, height, depth } = this.worldDims;
    let positions: Float32Array;
    // order: v0, v1, v2, v3 for TRIANGLE_STRIP
    if (axis === 'axial') {
      const z = (index / Math.max(1, depth - 1)) * wz - wz / 2;
      positions = new Float32Array([
        -wx / 2, -wy / 2, z,
        wx / 2, -wy / 2, z,
        -wx / 2, wy / 2, z,
        wx / 2, wy / 2, z,
      ]);
    } else if (axis === 'sagittal') {
      const x = (index / Math.max(1, width - 1)) * wx - wx / 2;
      // z maps to u, y maps to v
      positions = new Float32Array([
        x, -wy / 2, -wz / 2,
        x, -wy / 2, wz / 2,
        x, wy / 2, -wz / 2,
        x, wy / 2, wz / 2,
      ]);
    } else {
      // coronal
      const y = (index / Math.max(1, height - 1)) * wy - wy / 2;
      positions = new Float32Array([
        -wx / 2, y, -wz / 2,
        wx / 2, y, -wz / 2,
        -wx / 2, y, wz / 2,
        wx / 2, y, wz / 2,
      ]);
    }

    const texcoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    if (!this.slicePosBuffer || !this.sliceTexBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.slicePosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sliceTexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texcoords, this.gl.STATIC_DRAW);
  }
}
