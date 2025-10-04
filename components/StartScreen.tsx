/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '@/lib/utils';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {!userImageUrl ? (
        <div className="container">
          <div className="grid-2 gap-12 lg:gap-16">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-accent-text rounded-full mr-3"></div>
                  <span className="accent-text text-sm font-medium uppercase tracking-wider">Luxury Fashion Experience</span>
                </div>
                <h1 className="brand-title text-5xl lg:text-7xl mb-6">
                  SPANNICK
                  <br />
                  <span className="text-3xl lg:text-5xl font-normal tracking-widest accent-text">DESIGNERS</span>
                </h1>
                <p className="body-text text-lg lg:text-xl mb-8 leading-relaxed">
                  Where tradition meets innovation. Upload your photograph and witness our atelier's AI craft your personal fashion avatar, ready to showcase our exclusive menswear collection.
                </p>
                <div className="w-24 h-0.5 bg-accent-text mb-8"></div>
              </div>
              
              <div className="space-y-4">
                <label htmlFor="image-upload-start" className="btn-primary inline-flex items-center cursor-pointer">
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  BEGIN TRANSFORMATION
                </label>
                <input 
                  id="image-upload-start" 
                  type="file" 
                  className="sr-only" 
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                  onChange={handleFileChange} 
                />
                <p className="body-text text-sm leading-relaxed">
                  Select a clear, full-body photograph. Portrait compositions are acceptable, though full-body images yield optimal results.
                </p>
                <p className="text-xs opacity-75">
                  By proceeding, you consent to responsible and lawful use of our premium AI styling atelier.
                </p>
                {error && (
                  <div className="glass-card p-4 border-red-500 border">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content - Demo */}
            <div className="flex-center">
              <div className="text-center">
                <Compare
                  firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
                  secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
                  slideMode="drag"
                  className="w-80 aspect-[2/3] rounded-2xl image-container mx-auto"
                />
                <div className="mt-6">
                  <p className="accent-text font-semibold text-sm uppercase tracking-wider mb-2">Drag to Compare</p>
                  <p className="body-text text-sm opacity-75">Witness the transformation in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="grid-2 gap-12">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-accent-text rounded-full mr-3"></div>
                  <span className="accent-text text-sm font-medium uppercase tracking-wider">Transformation Complete</span>
                </div>
                <h1 className="brand-title text-4xl lg:text-6xl mb-4">
                  Your Bespoke
                  <br />
                  <span className="text-2xl lg:text-4xl font-normal tracking-wider accent-text">AVATAR</span>
                </h1>
                <p className="body-text text-lg leading-relaxed">
                  Witness your metamorphosis. Drag the slider to reveal your sophisticated digital persona, meticulously crafted for the finest menswear experience.
                </p>
              </div>
              
              {isGenerating && (
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <Spinner />
                    <span className="accent-text font-medium">Crafting your bespoke avatar...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="glass-card p-6 border-red-500 border mb-6">
                  <h3 className="font-semibold text-lg mb-2 text-red-400">Transformation Interrupted</h3>
                  <p className="body-text mb-4">{error}</p>
                  <button onClick={reset} className="btn-ghost">
                    Retry Transformation
                  </button>
                </div>
              )}
              
              {generatedModelUrl && !isGenerating && !error && (
                <div className="flex gap-4">
                  <button onClick={reset} className="btn-secondary">
                    SELECT DIFFERENT IMAGE
                  </button>
                  <button onClick={() => onModelFinalized(generatedModelUrl)} className="btn-primary">
                    ENTER ATELIER →
                  </button>
                </div>
              )}
            </div>

            {/* Right Content - Comparison */}
            <div className="flex-center">
              <div className={`image-container transition-all duration-300 ${isGenerating ? 'border-accent-text' : ''}`}>
                <Compare
                  firstImage={userImageUrl}
                  secondImage={generatedModelUrl ?? userImageUrl}
                  slideMode="drag"
                  className="w-80 aspect-[2/3] rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;