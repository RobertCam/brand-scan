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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Brand Insights MVP
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Analyze your brand&apos;s online presence, competitive positioning, and discover 
            opportunities to improve AI-search visibility, SEO, and social resonance.
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!analysisData ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <BrandAnalysisForm onSubmit={handleAnalysis} isLoading={isLoading} />
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg" role="alert" aria-live="polite">
                  <p className="text-red-900 font-semibold">{error}</p>
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

        {/* Features */}
        {!analysisData && (
          <section className="mt-16" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Web Search Analysis</h3>
                <p className="text-gray-700">
                  Comprehensive analysis across web, news, forums, and social platforms using OpenAI&apos;s web search.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Schema.org Analysis</h3>
                <p className="text-gray-700">
                  Extract and analyze structured data to improve AI-search readiness and SEO health scoring.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Reports</h3>
                <p className="text-gray-700">
                  Export professional reports to PDF or Markdown with citations and visual rankings.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}