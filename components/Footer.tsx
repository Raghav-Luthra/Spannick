/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const REMIX_SUGGESTIONS = [
  "Luxury Enhancement: Generate personalized lookbooks with styling notes.",
  "Premium Feature: Integrate with luxury fashion houses for authentic pieces.",
  "Atelier Addition: Add bespoke accessories and custom tailoring options.",
  "Style Intelligence: AI-powered style scoring and recommendations.",
  "Personal Collection: Save and curate your exclusive wardrobe.",
  "Color Mastery: Generate premium colorways and fabric variations.",
];

interface FooterProps {
  isOnDressingScreen?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false }) => {
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % REMIX_SUGGESTIONS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className={`fixed bottom-0 left-0 right-0 glass-card border-t border-opacity-20 z-10 ${isOnDressingScreen ? 'hidden' : ''}`}>
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 md:py-3 text-sm">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-0">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-text rounded-full"></div>
            <p className="accent-text font-medium text-xs md:text-sm">
              <span className="hidden sm:inline">Spannick Designers © 1994 - Luxury Menswear Atelier</span>
              <span className="sm:hidden">Spannick Designers © 1994</span>
            </p>
          </div>
          <div className="text-center sm:text-right hidden sm:block">
            <p className="body-text text-xs italic opacity-75 fade-in">
              {REMIX_SUGGESTIONS[suggestionIndex]}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;