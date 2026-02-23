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
    // Here you'd normally pass `vol` to the renderer to visualize as a volume
  };

  return (
    <div className="layout">
      <Sidebar metadata={metadata} />
      <div className="main">
        <div className="topbar">
          <DicomLoader onVolumeSlices={handleSlices} />
        </div>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default App;
