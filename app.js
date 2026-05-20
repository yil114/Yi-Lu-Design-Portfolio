import React, { useRef, useEffect, useState } from 'react';

const ScratchLayer = () => {
  // State for UI and Tools
  const [mode, setMode] = useState('base'); // 'base', 'scratch', 'doodle'
  const [color, setColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas Refs
  const baseCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize Canvases
  useEffect(() => {
    const resize = () => {
      [baseCanvasRef, overlayCanvasRef].forEach(ref => {
        const canvas = ref.current;
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      });
      if (mode === 'base') fillWhite(baseCanvasRef.current);
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const fillWhite = (canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // The "Seal" Logic
  const handleSeal = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create Metallic/Textured Overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#9ca3af'); // Silver-ish
    gradient.addColorStop(0.5, '#4b5563');
    gradient.addColorStop(1, '#1f2937');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle "noise" texture for tactile feel
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    
    setMode('scratch');
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    const ctxBase = baseCanvasRef.current.getContext('2d');
    const ctxOverlay = overlayCanvasRef.current.getContext('2d');
    ctxBase.beginPath();
    ctxOverlay.beginPath();
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = mode === 'base' ? baseCanvasRef.current : overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'scratch') {
      // THE MAGIC: This erases the top layer to reveal the bottom
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="relative w-screen h-screen bg-gray-100 overflow-hidden font-sans">
      {/* 1. Base Layer (Drawing) */}
      <canvas
        ref={baseCanvasRef}
        className="absolute inset-0 z-0 touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* 2. Overlay Layer (Scratch/Doodle) */}
      <canvas
        ref={overlayCanvasRef}
        className={`absolute inset-0 z-10 touch-none transition-opacity duration-1000 ${
          mode === 'base' ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* UI TOOLBAR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/20">
          
          {/* Color Picker */}
          {mode !== 'scratch' && (
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full border-none cursor-pointer"
            />
          )}

          {/* Size Slider */}
          <div className="flex flex-col items-center">
            <input 
              type="range" min="5" max="100" 
              value={brushSize} 
              onChange={(e) => setBrushSize(e.target.value)}
              className="w-24 accent-indigo-500"
            />
            <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Size</span>
          </div>

          <div className="h-8 w-[1px] bg-gray-200" />

          {/* Dynamic Buttons */}
          {mode === 'base' ? (
            <button 
              onClick={handleSeal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium transition-all transform active:scale-95"
            >
              Seal Drawing
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setMode('scratch')}
                className={`px-4 py-2 rounded-full transition-all ${mode === 'scratch' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
              >
                Scratch
              </button>
              <button 
                onClick={() => setMode('doodle')}
                className={`px-4 py-2 rounded-full transition-all ${mode === 'doodle' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
              >
                Doodle
              </button>
              <button 
                onClick={() => setMode('base')}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="text-2xl font-light text-gray-800 tracking-tight">ScratchLayer</h1>
        <p className="text-sm text-gray-500">
          {mode === 'base' ? "Express yourself on the canvas..." : "Scratch to reveal, or draw on top."}
        </p>
      </div>
    </div>
  );
};

export default ScratchLayer;