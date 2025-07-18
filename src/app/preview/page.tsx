// PhotoBooth Preview Page
// This page allows users to preview, style, and download their photobooth strip with stickers and templates.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

type TemplateType = 'plain' | 'pink' | 'stickers' | 'yellow' | 'lgreen' | 'custom';

export default function PreviewPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('plain');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stickers, setStickers] = useState<Array<{ src: string; x: number; y: number; width: number; height: number }>>([]);

  const dragInfo = useRef<{
    index: number | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    index: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Draw the photo strip on the canvas
  const drawStrip = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    

    const width = 350;
    const photoHeight = 200;
    const spacing = 10;
    const height = photoHeight * 3 + spacing * 4;

    canvas.width = width;
    canvas.height = height;

    switch (selectedTemplate) {
      case 'pink':
        ctx.fillStyle = '#ffe4e6';
        break;
      case 'stickers':
        ctx.fillStyle = '#BB3E00';
        break;
      case 'yellow':
        ctx.fillStyle = '#F7AD45';
        break;
      case 'lgreen':
        ctx.fillStyle = '#657C6A';
        break;
      case 'plain':
      case 'custom':
      default:
        ctx.fillStyle = selectedColor || 'white';
        break;
    }

    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < images.length; i++) {
      const img = new window.Image();
      img.src = images[i];

      await new Promise<void>((resolve) => {
        img.onload = () => {
          const x = 20;
          const y = spacing + (photoHeight + spacing) * i;
          const photoWidth = width - 40;
          ctx.drawImage(img, x, y);
          resolve();
        };
      });
    }
  }, [images, selectedTemplate, selectedColor]);

  // Load captured images from sessionStorage or redirect to camera
  useEffect(() => {
    const captured = [
      sessionStorage.getItem('capturedImage1'),
      sessionStorage.getItem('capturedImage2'),
      sessionStorage.getItem('capturedImage3'),
    ].filter(Boolean) as string[];

    if (captured.length === 3) {
      setImages(captured);
    } else {
      router.push('/camera');
    }
  }, [router]);

  // Redraw strip when images or template change
  useEffect(() => {
    if (images.length === 3) {
      drawStrip();
    }
  }, [images, selectedTemplate, selectedColor, drawStrip]);

  // Handle drag start for stickers
  function onDragStart(e: React.DragEvent, index: number) {
    dragInfo.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      origX: stickers[index].x,
      origY: stickers[index].y,
    };
    e.dataTransfer.setDragImage(new window.Image(), 0, 0);
  }

  // Handle drag end for stickers
  function onDragEnd(e: React.DragEvent, index: number) {
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;

    setStickers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        x: dragInfo.current.origX + dx,
        y: dragInfo.current.origY + dy,
      };
      return updated;
    });

    dragInfo.current.index = null;
  }

  // Template and color selection handlers
  const handleTemplateSelect = (template: TemplateType) => {
    setSelectedTemplate(template);
    setSelectedColor(null);
  };

  const handleCustomColorSelect = (color: string) => {
    setSelectedTemplate('custom');
    setSelectedColor(color);
  };

  // Download the final strip as an image
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    for (const sticker of stickers) {
      const img = new window.Image();
      img.src = sticker.src;
      await new Promise((res) => (img.onload = res));
      ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
    }

    const link = document.createElement('a');
    link.href = offCanvas.toDataURL('image/png');
    link.download = 'photobooth-strip.png';
    link.click();
  };

  // Recapture photos
  const handleRecapture = () => {
    router.push('/camera');
  };

  // Render the preview UI, canvas, controls, and stickers
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen text-white p-4 md:p-6 gap-6"
      style={{
        background: 'linear-gradient(135deg,rgb(89, 111, 185),rgb(27, 103, 203))',
      }}>

      {/* Left: Canvas */}
      <div className="flex justify-center items-center w-full md:w-2/3">
        <div className="relative w-[90vw] max-w-[350px] h-[90vh] max-h-[630px]">
          <canvas ref={canvasRef} className="rounded-lg shadow-xl bg-white w-full h-full" />
          {stickers.map((sticker, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: sticker.y,
                left: sticker.x,
                width: sticker.width,
                height: sticker.height,
              }}
            >
              {/* Sticker image (draggable) */}
              <Image
                src={sticker.src}
                alt={`sticker-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragEnd={(e) => onDragEnd(e, i)}
                style={{
                  width: '100%',
                  height: '100%',
                  cursor: 'grab',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                }}
              />

              {/* Delete button */}
              <button
                onClick={() => {
                  setStickers((prev) => prev.filter((_, index) => index !== i));
                }}
                className="absolute top-0 right-0 text-xs bg-red-500 hover:bg-red-600 text-white rounded-full px-1"
                style={{
                  transform: 'translate(50%, -50%)',
                  cursor: 'pointer',
                }}
              >
                ✖
              </button>
            </div>
          ))}

        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex flex-col w-full md:w-1/3 md:ml-10 mt-6 md:mt-0">
        <h2 className="text-2xl mb-4">🎨 Choose a Strip Style:</h2>

        <div className="grid grid-cols-5 gap-4 mb-4 place-items-center">

          {/* Predefined Templates */}
          {[
            {  key: 'plain', color: 'white' },
            {  key: 'pink', color: '#ffe4e6' },
            {  key: 'stickers', color: '#BB3E00' },
            {  key: 'yellow', color: '#F7AD45' },
            {  key: 'lgreen', color: '#657C6A' },
          ].map(({key, color }) => (
            <div
              key={key}
              onClick={() => handleTemplateSelect(key as TemplateType)}
              className={`w-12 h-12 cursor-pointer border-2 rounded-lg ${selectedTemplate === key && !selectedColor ? 'border-black' : 'border-gray-600'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}

          {/* Custom Colors */}
          {[
            '#FF90BB', '#FFC1DA', '#F8F8E1', '#8ACCD5', '#8E7DBE',
            '#4A102A', '#000000', '#213448', '#03A791', '#522546',
          ].map((color) => (
            <div
              key={color}
              onClick={() => handleCustomColorSelect(color)}
              className={`w-12 h-12 cursor-pointer border-2 rounded-lg ${selectedColor === color ? 'border-black' : 'border-gray-600'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>


        {/* Stickers */}
        <h2 className="text-2xl mb-4">🧸 Add Stickers:</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap md:flex-nowrap overflow-x-auto gap-4 mb-6">

            {['/stickers/demo1.png', '/stickers/demo2.png', '/stickers/demo3.png', '/stickers/demo4.png', '/stickers/demo5.png', '/stickers/demo6.png', '/stickers/demo7.png'].map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`sticker-option-${idx + 1}`}
                className="w-12 h-12 cursor-pointer border-2 rounded-lg hover:border-black"
                onClick={() =>
                  setStickers((prev) => [
                    ...prev,
                    { src, x: 150, y: 300, width: 50, height: 50 },
                  ])
                }
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        {/* <div className="flex gap-4"> */}
        <div className="flex gap-4 justify-center mt-4">

          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full shadow-lg"
          >
            ⬇ Download
          </button>
          <button
            onClick={handleRecapture}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg"
          >
            🔄 Recapture
          </button>
        </div>
      </div>
    </div>
  );
}
