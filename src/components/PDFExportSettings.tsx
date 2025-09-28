'use client';

import React, { useState } from 'react';
import { Download, Settings, FileText } from 'lucide-react';
import { PDFExportOptions, DEFAULT_PDF_OPTIONS } from '@/lib/pdf-export';

interface PDFExportSettingsProps {
  onExport: (options: PDFExportOptions) => void;
  isExporting?: boolean;
  className?: string;
}

export default function PDFExportSettings({ onExport, isExporting = false, className = '' }: PDFExportSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>(DEFAULT_PDF_OPTIONS);

  const handleExport = () => {
    onExport(options);
    setIsOpen(false);
  };

  const updateOption = <K extends keyof PDFExportOptions>(key: K, value: PDFExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Export to PDF"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              PDF Export Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Title and Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={options.title}
                onChange={(e) => updateOption('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brand Analysis Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={options.subtitle || ''}
                onChange={(e) => updateOption('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Custom subtitle"
              />
            </div>

            {/* Page Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select
                  value={options.pageSize}
                  onChange={(e) => updateOption('pageSize', e.target.value as 'A4' | 'Letter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  value={options.orientation}
                  onChange={(e) => updateOption('orientation', e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            {/* Content Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Include in PDF:</h4>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeInsights}
                  onChange={(e) => updateOption('includeInsights', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Chart insights and analysis</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => updateOption('includeMetadata', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Brand profile and overview</span>
              </label>
            </div>

            {/* Quality Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Quality: {Math.round(options.quality * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={options.quality}
                onChange={(e) => updateOption('quality', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lower Size</span>
                <span>Higher Quality</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
