'use client';

import { useState, useCallback } from 'react';
import { forwardGeocode } from '@/lib/geocoding';

interface SearchResult {
  place_name: string;
  center: [number, number]; // [lon, lat]
}

interface Props {
  onLocationSelect: (lon: number, lat: number) => void;
}

export function LocationSearch({ onLocationSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults = await forwardGeocode(searchQuery);
    setResults(searchResults);
    setIsSearching(false);
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="Search location..."
        className="w-full px-4 py-2 border-2 border-black glass-card text-sm font-medium focus:border-[#DC2626] outline-none transition-colors"
      />

      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 glass-card border-2 border-black z-20">
          <p className="text-sm text-black/60">Searching...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border-2 border-black max-h-64 overflow-y-auto z-20">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onLocationSelect(result.center[0], result.center[1]);
                setQuery(result.place_name);
                setResults([]);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-black/5 transition-colors border-b border-black/10 last:border-b-0"
            >
              {result.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
