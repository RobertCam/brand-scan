'use client';

import { useState } from 'react';
import Image from 'next/image';
import { track } from '@vercel/analytics';
// Removed unused imports: Search, Download, FileText
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';
import BrandAnalysisForm from '@/components/BrandAnalysisForm';
import BrandReport from '@/components/BrandReport';

export default function Home() {
  const [analysisData, setAnalysisData] = useState<BrandAnalysisWithMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async (formData: {
    brand: string;
    competitors: string[];
    region: string;
    sinceDays: number;
    roastMode: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    // Track analysis start
    track('brand_analysis_started', {
      brand: formData.brand,
      competitors_count: formData.competitors.length,
      region: formData.region,
      roast_mode: formData.roastMode,
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisData(data);
      
      // Track successful analysis completion
      track('brand_analysis_completed', {
        brand: formData.brand,
        roast_mode: formData.roastMode,
        analysis_type: formData.roastMode ? 'burn_report' : 'professional',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Track analysis failure
      track('brand_analysis_failed', {
        brand: formData.brand,
        roast_mode: formData.roastMode,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="mb-6">
            {/* Brand Scan Logo */}
            <div className="flex items-center justify-center mb-6">
              <Image 
                src="/brand-scan-logo.png" 
                alt="Brand Scan Logo" 
                width={64}
                height={64}
                className="h-16 w-auto"
              />
            </div>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Analyze your brand&apos;s online presence, 
            competitive positioning, and discover opportunities to improve AI-search visibility, 
            SEO, and social resonance.
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {!analysisData ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <BrandAnalysisForm onSubmit={handleAnalysis} isLoading={isLoading} />
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-1">Analysis Failed</h3>
                      <p className="text-sm text-red-700 mb-2">{error}</p>
                      <p className="text-sm text-red-600">
                        Please refresh the page and try again. If the issue persists, check your internet connection or try again later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <BrandReport 
              data={analysisData} 
              onNewAnalysis={() => {
                setAnalysisData(null);
                setError(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}