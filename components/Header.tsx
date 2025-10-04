/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ShirtIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-opacity-20">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <ShirtIcon className="w-6 h-6 accent-text" />
            <h1 className="brand-title text-xl tracking-widest">
              SPANNICK DESIGNERS
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className="body-text text-sm">By Luthra's</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;