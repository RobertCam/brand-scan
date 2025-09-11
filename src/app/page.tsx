'use client';

import { useState } from 'react';
import { Search, Download, FileText } from 'lucide-react';
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
  }) => {
    setIsLoading(true);
    setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
              <img 
                src="/brand-scan-logo.png" 
                alt="Brand Scan Logo" 
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
                  <p className="text-red-900 font-medium">{error}</p>
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