import React, { useEffect, useRef } from 'react';
import { IWebGLRenderer } from './rendering/IRenderer';
import { WebGLRenderer } from './rendering/WebGLRenderer';

import vertSource from '../shaders/triangle.vert.glsl';
import fragSource from '../shaders/triangle.frag.glsl';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IWebGLRenderer | null>(null);

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

  return <canvas ref={canvasRef} />;
};

export default App;
