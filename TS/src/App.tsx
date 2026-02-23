import React, { useEffect, useRef, useState } from 'react';
import { IWebGLRenderer } from './rendering/IRenderer';
import { WebGLRenderer } from './rendering/WebGLRenderer';
import Sidebar from './components/Sidebar';
import DicomLoader from './components/DicomLoader';
import { Volume, Slice } from './volume/Volume';

import vertSource from '../shaders/triangle.vert.glsl';
import fragSource from '../shaders/triangle.frag.glsl';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IWebGLRenderer | null>(null);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string | number | undefined> | null>(null);
  const [axial, setAxial] = useState<number>(0);
  const [sagittal, setSagittal] = useState<number>(0);
  const [coronal, setCoronal] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new WebGLRenderer(canvas, vertSource, fragSource);
    rendererRef.current = renderer;
    renderer.start();

    return () => {
      renderer.stop();
      renderer.dispose();
    };
  }, []);

  const handleSlices = (slices: Slice[], meta: Record<string, string | number | undefined>) => {
    const vol = new Volume(slices);
    setVolume(vol);
    setMetadata(meta);
    // Pass volume dims to renderer to show bounding box
    const r = rendererRef.current as any;
    if (r && typeof r.setVolumeDimensions === 'function') {
      r.setVolumeDimensions(vol.width, vol.height, vol.depth, vol.spacing);
    }
    if (r && typeof r.setVolume === 'function') {
      r.setVolume(vol);
    }
    // initialize slice positions to center
    setAxial(Math.floor(vol.depth / 2));
    setSagittal(Math.floor(vol.width / 2));
    setCoronal(Math.floor(vol.height / 2));
    if (r && typeof r.setSliceIndices === 'function') {
      r.setSliceIndices(Math.floor(vol.depth / 2), Math.floor(vol.width / 2), Math.floor(vol.height / 2));
    }
  };

  return (
    <div className="layout">
      <Sidebar metadata={metadata} />
      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <DicomLoader onVolumeSlices={handleSlices} />
            <div className="slices">
              <label>Axial: <input type="range" min={0} max={volume?volume.depth-1:0} value={axial} onChange={(e)=>{const v=Number(e.target.value);setAxial(v); (rendererRef.current as any)?.setSliceIndices(v, sagittal, coronal)}}/></label>
              <label>Sagittal: <input type="range" min={0} max={volume?volume.width-1:0} value={sagittal} onChange={(e)=>{const v=Number(e.target.value);setSagittal(v); (rendererRef.current as any)?.setSliceIndices(axial, v, coronal)}}/></label>
              <label>Coronal: <input type="range" min={0} max={volume?volume.height-1:0} value={coronal} onChange={(e)=>{const v=Number(e.target.value);setCoronal(v); (rendererRef.current as any)?.setSliceIndices(axial, sagittal, v)}}/></label>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default App;
