export interface IWebGLRenderer {
  start(): void;
  stop(): void;
  dispose(): void;
  setVolumeDimensions?(width: number, height: number, depth: number, spacing: [number, number, number]): void;
  setSliceIndices?(axial: number, sagittal: number, coronal: number): void;
  setVolume?(vol: any): void;
}
