'use client';

import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandAnalysisFormProps {
  onSubmit: (data: {
    brand: string;
    competitors: string[];
    region: string;
    sinceDays: number;
    roastMode: boolean;
  }) => void;
  isLoading: boolean;
}

export default function BrandAnalysisForm({ onSubmit, isLoading }: BrandAnalysisFormProps) {
  const [brand, setBrand] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [region, setRegion] = useState('global');
  const [sinceDays, setSinceDays] = useState(30);
  const [roastMode, setRoastMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredCompetitors = competitors.filter(comp => comp.trim() !== '');
    
    onSubmit({
      brand: brand.trim(),
      competitors: filteredCompetitors,
      region,
      sinceDays,
      roastMode,
    });
  };

  const addCompetitor = () => {
    setCompetitors([...competitors, '']);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="brand" className="block text-sm font-semibold text-gray-900 mb-2">
          Brand Name *
        </label>
        <input
          type="text"
          id="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g., Apple, Tesla, Nike"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
          aria-describedby="brand-help"
        />
        <p id="brand-help" className="mt-1 text-sm text-gray-600">
          Enter the primary brand you want to analyze
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Competitors (Optional)
        </label>
        <div className="space-y-2">
          {competitors.map((competitor, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={competitor}
                onChange={(e) => updateCompetitor(index, e.target.value)}
                placeholder="Competitor name"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                aria-label={`Competitor ${index + 1}`}
              />
              {competitors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Remove competitor ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCompetitor}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Add another competitor"
          >
            <Plus className="w-4 h-4" />
            Add Competitor
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="region" className="block text-sm font-semibold text-gray-900 mb-2">
            Region
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="global">Global</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
            <option value="jp">Japan</option>
          </select>
        </div>

        <div>
          <label htmlFor="sinceDays" className="block text-sm font-semibold text-gray-900 mb-2">
            Time Window (Days)
          </label>
          <select
            id="sinceDays"
            value={sinceDays}
            onChange={(e) => setSinceDays(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Burn Report Toggle */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">🔥 Burn Report</h3>
            <p className="text-sm text-gray-600">
              Get a sophisticated, dry-humored analysis with Bill Murray's deadpan wit and Marc Maron's sharp insights. Perfect for teams who appreciate smart comedy.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={roastMode}
              onChange={(e) => setRoastMode(e.target.checked)}
              className="sr-only peer"
              aria-describedby="roast-mode-help"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
        <p id="roast-mode-help" className="mt-2 text-xs text-gray-500">
          {roastMode ? "🔥 Burn Report enabled - prepare for some sophisticated wit!" : "Standard professional analysis"}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !brand.trim()}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-colors',
          isLoading || !brand.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        )}
        aria-describedby="submit-help"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing Brand...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Scan Brand
          </>
        )}
      </button>
      <p id="submit-help" className="mt-2 text-sm text-gray-600">
        {isLoading ? 'Please wait while we scan your brand...' : 'Click to start the brand scan process'}
      </p>
    </form>
  );
}

