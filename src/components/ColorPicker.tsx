'use client';

import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { DEFAULT_THEMES, ChartTheme, generateColorPalette } from '@/lib/chart-themes';

interface ColorPickerProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  className?: string;
}

export default function ColorPicker({ selectedColors, onColorsChange, className = '' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#3B82F6');

  const handleThemeSelect = (theme: ChartTheme) => {
    onColorsChange(theme.colors.primary);
    setIsOpen(false);
  };

  const handleCustomColorAdd = () => {
    if (customColor && !selectedColors.includes(customColor)) {
      onColorsChange([...selectedColors, customColor]);
    }
  };

  const handleColorRemove = (colorToRemove: string) => {
    onColorsChange(selectedColors.filter(color => color !== colorToRemove));
  };

  const handleGeneratePalette = () => {
    const palette = generateColorPalette(customColor, 6);
    onColorsChange(palette);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open color picker"
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium">Colors</span>
        <div className="flex gap-1">
          {selectedColors.slice(0, 3).map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
          ))}
          {selectedColors.length > 3 && (
            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-200 flex items-center justify-center text-xs">
              +{selectedColors.length - 3}
            </div>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Choose Colors</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Presets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-2">
                    {theme.colors.primary.slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-medium text-gray-900">{theme.name}</div>
                  <div className="text-xs text-gray-500">{theme.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Color</h4>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="#3B82F6"
              />
              <button
                onClick={handleCustomColorAdd}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <button
              onClick={handleGeneratePalette}
              className="mt-2 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Generate Palette from Color
            </button>
          </div>

          {/* Current Colors */}
          {selectedColors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Colors</h4>
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600">{color}</span>
                    <button
                      onClick={() => handleColorRemove(color)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
