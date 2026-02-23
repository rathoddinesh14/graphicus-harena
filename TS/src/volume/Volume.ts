export interface Slice {
  instanceNumber?: number;
  imagePosition?: number; // position along the slice normal (z)
  rows: number;
  cols: number;
  pixelSpacing?: [number, number];
  bitsAllocated?: number;
  pixelData: Uint8Array | Uint16Array;
}

export class Volume {
  public width: number = 0;
  public height: number = 0;
  public depth: number = 0;
  public spacing: [number, number, number] = [1, 1, 1];
  public data: Float32Array | null = null; // linearized volume data

  constructor(public slices: Slice[] = []) {
    if (slices.length) this.buildFromSlices(slices);
  }

  buildFromSlices(slices: Slice[]) {
    // sort slices by imagePosition or instanceNumber
    const sorted = [...slices].sort((a, b) => {
      if (a.imagePosition !== undefined && b.imagePosition !== undefined) return a.imagePosition - b.imagePosition;
      if (a.instanceNumber !== undefined && b.instanceNumber !== undefined) return a.instanceNumber - b.instanceNumber;
      return 0;
    });

    const first = sorted[0];
    this.width = first.cols;
    this.height = first.rows;
    this.depth = sorted.length;

    // set spacing if available
    const ps = first.pixelSpacing;
    if (ps) this.spacing = [ps[0], ps[1], 1];

    // allocate data as Float32
    this.data = new Float32Array(this.width * this.height * this.depth);

    // compute min/max while copying
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    // copy slices into data
    for (let z = 0; z < this.depth; z++) {
      const slice = sorted[z];
      const src = slice.pixelData;
      const planeOffset = z * this.width * this.height;
      // assume src is row-major unsigned
      for (let i = 0; i < src.length && i < this.width * this.height; i++) {
        this.data[planeOffset + i] = src[i];
        const v = this.data[planeOffset + i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 1;
    this._minValue = min;
    this._maxValue = max;
  }

  private _minValue: number = 0;
  private _maxValue: number = 1;

  // axis: 'axial' (z), 'sagittal' (x), 'coronal' (y)
  getSliceUint8(axis: 'axial' | 'sagittal' | 'coronal', index: number): { data: Uint8Array; width: number; height: number } {
    if (!this.data) return { data: new Uint8Array(0), width: 0, height: 0 };
    const min = this._minValue;
    const max = this._maxValue;
    const range = max - min || 1;

    if (axis === 'axial') {
      const w = this.width;
      const h = this.height;
      const out = new Uint8Array(w * h);
      const z = Math.max(0, Math.min(this.depth - 1, index));
      const offset = z * w * h;
      for (let i = 0; i < w * h; i++) {
        const v = this.data[offset + i];
        out[i] = Math.round(((v - min) / range) * 255);
      }
      return { data: out, width: w, height: h };
    }

    if (axis === 'sagittal') {
      // x index -> plane of size depth x height (z horizontally, y vertically)
      const w = this.depth;
      const h = this.height;
      const out = new Uint8Array(w * h);
      const x = Math.max(0, Math.min(this.width - 1, index));
      for (let y = 0; y < h; y++) {
        for (let z = 0; z < this.depth; z++) {
          const v = this.getVoxel(x, y, z);
          const idx = y * w + z;
          out[idx] = Math.round(((v - min) / range) * 255);
        }
      }
      return { data: out, width: w, height: h };
    }

    // coronal: y index -> plane of size width x depth (x horizontally, z vertically)
    const w = this.width;
    const h = this.depth;
    const out = new Uint8Array(w * h);
    const yIdx = Math.max(0, Math.min(this.height - 1, index));
    for (let z = 0; z < this.depth; z++) {
      for (let x = 0; x < this.width; x++) {
        const v = this.getVoxel(x, yIdx, z);
        const idx = z * w + x;
        out[idx] = Math.round(((v - min) / range) * 255);
      }
    }
    return { data: out, width: w, height: h };
  }

  getIndex(x: number, y: number, z: number) {
    return z * this.width * this.height + y * this.width + x;
  }

  getVoxel(x: number, y: number, z: number) {
    if (!this.data) return 0;
    return this.data[this.getIndex(x, y, z)];
  }
}
