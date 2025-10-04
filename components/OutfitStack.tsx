/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment }) => {
  return (
    <div className="space-y-3 md:space-y-4">
      <h2 className="section-title text-lg md:text-xl border-b border-accent-text border-opacity-30 pb-2 md:pb-3">
        Ensemble Stack
      </h2>

      <div className="space-y-2 md:space-y-3">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.garment?.id || 'base'}
            className="luxury-card flex items-center justify-between fade-in"
          >
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-accent-text text-black rounded-full flex-center text-xs md:text-sm font-bold">
                {index + 1}
              </span>

              {layer.garment && (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-accent-text border-opacity-30 flex-shrink-0">
                  <img
                    src={layer.garment.url}
                    alt={layer.garment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <span className="font-semibold text-sm md:text-base truncate" title={layer.garment?.name}>
                {layer.garment ? layer.garment.name : 'Base Avatar'}
              </span>
            </div>

            {index > 0 && index === outfitHistory.length - 1 && (
              <button
                onClick={onRemoveLastGarment}
                className="flex-shrink-0 p-1.5 md:p-2 text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-all"
                aria-label={`Remove ${layer.garment?.name}`}
              >
                <Trash2Icon className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        ))}

        {outfitHistory.length === 1 && (
          <div className="text-center py-4 md:py-8">
            <p className="body-text text-xs md:text-sm opacity-75">
              Your curated pieces will appear here. Select an item from the atelier collection below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;