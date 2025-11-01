/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';

interface CompareProps {
  firstImage: string | null;
  secondImage: string | null;
  slideMode: 'drag' | 'hover';
  className?: string;
}

export const Compare: React.FC<CompareProps> = ({
  firstImage,
  secondImage,
  slideMode,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    if (slideMode === 'drag') {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (slideMode === 'drag') {
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [slideMode]);

  if (!firstImage || !secondImage) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <p className="text-gray-400 text-sm">Loading images...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-900 select-none cursor-col-resize ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      <img
        src={firstImage}
        alt="First comparison image"
        className="w-full h-full object-cover"
        draggable={false}
      />

      <div
        className="absolute top-0 left-0 h-full overflow-hidden transition-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={secondImage}
          alt="Second comparison image"
          className="w-full h-full object-cover"
          style={{ width: `${containerRef.current?.offsetWidth || 0}px` }}
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-accent-text transition-none cursor-col-resize"
        style={{
          left: `${sliderPosition}%`,
          boxShadow: '0 0 10px rgba(212, 175, 55, 0.6)'
        }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-accent-text rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-black rounded-full"></div>
            <div className="w-0.5 h-3 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
