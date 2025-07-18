// CameraFeed Component
// Handles webcam capture, filter application, and photo sequence for the photobooth.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import Image from "next/image";
import { useRouter } from 'next/navigation';

const filters = {
  normal: 'none',
  blackAndWhite: 'grayscale(1) contrast(1.3)',
  warmVintage: 'sepia(0.4) saturate(1.3) brightness(1.1)',
  fadedRetro: 'contrast(0.8) brightness(1.1) saturate(0.7)',
  dustyFilm: 'sepia(0.6) brightness(0.9) contrast(1.2)',
  mellowTone: 'grayscale(0.3) sepia(0.2) brightness(1.1)',
  polaroidFade: 'brightness(1.2) contrast(0.85) sepia(0.25)',
  oldSchool: 'grayscale(0.5) contrast(1.2) sepia(0.5)',

};

export default function CameraFeed() {
  // Webcam reference and router
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();

  // State for filter, capture sequence, countdown, images, flash, and preview
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof filters>('normal');
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [readyToPreview, setReadyToPreview] = useState(false);

  // Start the photo capture sequence
  const startCaptureSequence = () => {
    setCapturedImages([]);
    setCapturing(true);
    setCountdown(3);
    setReadyToPreview(false);
  };
  // Capture an image from the webcam and apply the selected filter
  const captureImage = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;

    const screenshot = webcam.getScreenshot();
    if (!screenshot) return;

    const img = new window.Image();
    img.src = screenshot;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = filters[selectedFilter] || 'none';
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // flip horizontally
        ctx.filter = filters[selectedFilter] || 'none';
        ctx.drawImage(img, 0, 0, img.width, img.height);
        ctx.restore();


        const filteredDataUrl = canvas.toDataURL('image/jpeg');

        setCapturedImages((prev) => [...prev, filteredDataUrl]);

        // Flash animation
        setFlash(true);
        setTimeout(() => setFlash(false), 150);

        if (capturedImages.length + 1 < 3) {
          setCountdown(3); // Start next countdown
        } else {
          setCapturing(false);
          setReadyToPreview(true);
        }
      }
    };
  }, [selectedFilter, setCapturedImages, setFlash, setCountdown, setCapturing, setReadyToPreview, capturedImages.length]);
  // Countdown and capture logic
  useEffect(() => {
    if (capturing) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => captureImage(), 100); // Give a small delay to apply the filter
      }
    }
  }, [capturing, countdown, captureImage]);
  // Apply a random filter
  const applyRandomFilter = () => {
    const filterNames = Object.keys(filters) as (keyof typeof filters)[];
    const randomFilter = filterNames[Math.floor(Math.random() * filterNames.length)];
    setSelectedFilter(randomFilter);
  };
  // Handle moving to the preview page
  const handleNext = () => {
    if (capturedImages.length === 3) {
      capturedImages.forEach((img, index) => {
        sessionStorage.setItem(`capturedImage${index + 1}`, img);
      });
      localStorage.setItem('appliedFilter', selectedFilter);

      setTimeout(() => {
        router.push('/preview');
      }, 100);
    }
  };
  // Render the webcam UI, filter buttons, and capture controls
  return (
    <main
      className="relative min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #1F51FF, #1F2937)',
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Webcam feed */}
        <div className="w-full max-w-lg aspect-[4/3] overflow-hidden rounded-2xl shadow-lg relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            className="w-full h-full object-cover"
            style={{ filter: filters[selectedFilter], transform: 'scaleX(-1)' }} // 🔄 remove mirror

          />

          {capturing && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent text-6xl font-bold">
              {countdown}
            </div>
          )}

          {flash && (
            <div className="absolute inset-0 bg-white opacity-80 animate-pulse rounded-2xl" />
          )}
        </div>

        {/* Captured thumbnails */}
        <div className="flex mt-4 gap-2">
          {capturedImages.map((img, index) => (
            <Image 
              key={index}
              src={img}
              alt={`Captured ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg border-2 border-pink-400"
            />
          ))}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-6 flex-wrap justify-center">
          {Object.keys(filters).map((filterName) => (
            <button
              key={filterName}
              onClick={() => setSelectedFilter(filterName as keyof typeof filters)}
              disabled={capturing}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition ${selectedFilter === filterName
                  ? 'bg-white text-black'
                  : 'bg-gray-700 hover:bg-gray-600'
                }`}
            >
              {filterName.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>

        {/* Manual Random Filter Button */}
        <button
          onClick={applyRandomFilter}
          disabled={capturing}
          className="mt-4 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full text-sm shadow-md transition"
        >
          🎲 Random Filter
        </button>

        {/* Start or Next Button */}
        <button
          onClick={readyToPreview ? handleNext : startCaptureSequence}
          disabled={capturing && capturedImages.length < 3}
          className="mt-8 px-6 py-3 bg-[#1B56FD] hover:bg-[#1B56FD] rounded-full shadow-lg transition disabled:opacity-50"
        >
          {readyToPreview ? 'Next →' : capturing ? 'Capturing...' : 'Start 📸'}
        </button>
      </div>
    </main>
  );
}
