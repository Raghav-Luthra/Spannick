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

      {/* Pose Navigation - Mobile Only Under Avatar */}
      {displayImageUrl && !isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-[calc(100%-2rem)] md:hidden">
          <div className="glass-card p-2.5 flex items-center gap-2.5 justify-center">
            <button
              onClick={handlePreviousPose}
              disabled={isLoading}
              className="btn-ghost p-1.5"
              aria-label="Previous pose"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium w-28 text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>

            <button
              onClick={handleNextPose}
              disabled={isLoading}
              className="btn-ghost p-1.5"
              aria-label="Next pose"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;