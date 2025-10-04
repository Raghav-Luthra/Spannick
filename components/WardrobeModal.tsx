/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

  return (
    <div className="space-y-3 md:space-y-4">
      <h2 className="section-title text-lg md:text-xl border-b border-accent-text border-opacity-30 pb-2 md:pb-3">
        Atelier Collection
      </h2>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {wardrobe.map((item) => {
          const isActive = activeGarmentIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleGarmentClick(item)}
              disabled={isLoading || isActive}
              className="relative aspect-square group image-container disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={`Select ${item.name}`}
            >
              <img 
                src={item.url} 
                alt={item.name} 
                className="w-full h-full object-cover" 
              />
              
              <div className="absolute inset-0 bg-black bg-opacity-60 flex-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs md:text-sm font-semibold text-center p-1.5 md:p-2">
                  {item.name}
                </p>
              </div>
              
              {isActive && (
                <div className="absolute inset-0 bg-accent-text bg-opacity-80 flex-center">
                  <CheckCircleIcon className="w-6 h-6 md:w-8 md:h-8 text-black" />
                </div>
              )}
            </button>
          );
        })}
        
        <label
          htmlFor="custom-garment-upload"
          className={`aspect-square border-2 border-dashed border-accent-text border-opacity-40 rounded-lg flex-center flex-col cursor-pointer transition-all ${
            isLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-accent-text hover:border-opacity-80'
          }`}
        >
          <UploadCloudIcon className="w-6 h-6 md:w-7 md:h-7 mb-1 md:mb-2 accent-text"/>
          <span className="text-xs md:text-sm font-medium">Upload</span>
          <input 
            id="custom-garment-upload" 
            type="file" 
            className="sr-only" 
            accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
            onChange={handleFileChange} 
            disabled={isLoading}
          />
        </label>
      </div>
      
      {wardrobe.length === 0 && (
        <div className="text-center py-4 md:py-8">
          <p className="body-text text-xs md:text-sm opacity-75">
            Your bespoke pieces will appear here.
          </p>
        </div>
      )}

      {error && (
        <div className="glass-card p-3 md:p-4 border-red-500 border">
          <p className="text-red-400 text-xs md:text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default WardrobePanel;