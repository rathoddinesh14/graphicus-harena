import { IWebGLRenderer } from './IRenderer';
import { ShaderProgram } from './ShaderProgram';
import { TriangleMesh } from './TriangleMesh';

export class WebGLRenderer implements IWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: ShaderProgram | null = null;
  private mesh: TriangleMesh | null = null;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, vertexSource: string, fragmentSource: string) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    this.resizeCanvas();
    this.program = new ShaderProgram(gl, vertexSource, fragmentSource);
    this.mesh = new TriangleMesh(gl);
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
  }

  private render() {
    if (!this.program || !this.mesh) return;
    const gl = this.gl;
    gl.clearColor(0.1, 0.12, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.program.use();
    const posLoc = gl.getAttribLocation(this.program.program, 'a_position');
    this.mesh.bind(posLoc);
    this.mesh.draw();
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
  }
}
