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

    // copy slices into data
    for (let z = 0; z < this.depth; z++) {
      const slice = sorted[z];
      const src = slice.pixelData;
      const planeOffset = z * this.width * this.height;
      // assume src is row-major unsigned
      for (let i = 0; i < src.length && i < this.width * this.height; i++) {
        this.data[planeOffset + i] = src[i];
      }
    }
  }

  getIndex(x: number, y: number, z: number) {
    return z * this.width * this.height + y * this.width + x;
  }

  getVoxel(x: number, y: number, z: number) {
    if (!this.data) return 0;
    return this.data[this.getIndex(x, y, z)];
  }
}
