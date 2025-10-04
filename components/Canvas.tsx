/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import Spinner from './Spinner';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage, 
  onSelectPose, 
  poseInstructions, 
  currentPoseIndex, 
  availablePoseKeys 
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }

    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    
    if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) {
            onSelectPose(newGlobalPoseIndex);
        }
    } else {
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };
  
  return (
    <div className="w-full h-full flex-center relative group p-4 md:p-8">
      {/* Start Over Button */}
      <button
        onClick={onStartOver}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-30 btn-ghost flex items-center gap-2 text-xs md:text-sm"
      >
        <RotateCcwIcon className="w-4 h-4" />
        <span className="hidden sm:inline">NEW SESSION</span>
        <span className="sm:hidden">NEW</span>
      </button>

      {/* Main Image Display */}
      <div className="relative w-full max-w-md mx-auto">
        {displayImageUrl ? (
          <div className="image-container w-full">
            <img
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Virtual try-on model"
              className="w-full h-auto max-h-[60vh] md:max-h-[70vh] object-contain fade-in mx-auto"
            />
          </div>
        ) : (
          <div className="w-full aspect-[2/3] max-h-[60vh] glass-card flex-center flex-col">
            <Spinner />
            <p className="accent-text mt-4 font-medium text-sm md:text-base">Preparing Avatar...</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 glass-card flex-center flex-col">
            <Spinner />
            {loadingMessage && (
              <p className="accent-text mt-4 text-center font-medium text-sm md:text-base px-4">{loadingMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Pose Controls */}
      {displayImageUrl && !isLoading && (
        <div
          className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 w-[calc(100%-2rem)] md:w-auto"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          {/* Pose Menu */}
          {isPoseMenuOpen && (
            <div className="absolute bottom-full mb-4 w-full md:w-72 glass-card p-3 md:p-4 fade-in left-1/2 transform -translate-x-1/2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {poseInstructions.map((pose, index) => (
                  <button
                    key={pose}
                    onClick={() => onSelectPose(index)}
                    disabled={isLoading || index === currentPoseIndex}
                    className={`text-left text-xs md:text-sm p-2 md:p-3 rounded-lg transition-all ${
                      index === currentPoseIndex
                        ? 'bg-accent-text bg-opacity-20 font-semibold cursor-not-allowed'
                        : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pose Navigation */}
          <div className="glass-card p-2 md:p-3 flex items-center gap-2 md:gap-3 justify-center">
            <button
              onClick={handlePreviousPose}
              disabled={isLoading}
              className="btn-ghost p-1.5 md:p-2"
              aria-label="Previous pose"
            >
              <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <span className="text-xs md:text-sm font-medium w-32 md:w-48 text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>

            <button
              onClick={handleNextPose}
              disabled={isLoading}
              className="btn-ghost p-1.5 md:p-2"
              aria-label="Next pose"
            >
              <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;