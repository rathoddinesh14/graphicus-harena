import { Camera } from './Camera';

export class MouseController {
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private canvas: HTMLCanvasElement, private camera: Camera) {
    this.bind();
  }

  private bind() {
    this.canvas.addEventListener('mousedown', this.onDown);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose() {
    this.canvas.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mouseup', this.onUp);
    this.canvas.removeEventListener('wheel', this.onWheel as any);
  }

  private onDown = (ev: MouseEvent) => {
    this.dragging = true;
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
  };

  private onMove = (ev: MouseEvent) => {
    if (!this.dragging) return;
    const dx = (ev.clientX - this.lastX) * 0.01;
    const dy = (ev.clientY - this.lastY) * 0.01;
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
    // invert horizontal movement so dragging left/right feels natural
    this.camera.azimuth -= dx;
    this.camera.polar = Math.max(-1.4, Math.min(1.4, this.camera.polar + dy));
  };

  private onUp = () => {
    this.dragging = false;
  };

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    const delta = ev.deltaY * 0.01;
    this.camera.distance = Math.max(0.1, this.camera.distance + delta);
  };
}
