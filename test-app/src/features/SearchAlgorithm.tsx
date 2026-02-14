import { useState, useMemo } from 'react';
import { useFlag } from '../flags/FlagProvider';
import { products } from '../data/products';

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function SearchBar() {
  const algo = useFlag<string>('search-algorithm', 'basic');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    switch (algo) {
      case 'fuzzy':
        return products.filter((p) => fuzzyMatch(p.name, q) || fuzzyMatch(p.category, q));
      case 'ai':
      case 'basic':
      default:
        return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
  }, [query, algo]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {algo === 'ai' && (
          <span className="absolute right-3 top-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
            ✨ AI-powered
          </span>
        )}
        {algo === 'fuzzy' && (
          <span className="absolute right-3 top-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
            Fuzzy
          </span>
        )}
      </div>
      {query && (
        <p className="text-sm text-gray-500 mt-1">
          {results.length} result{results.length !== 1 ? 's' : ''} ({algo} search)
        </p>
      )}
    </div>
  );
}

export function useSearchResults(query: string) {
  const algo = useFlag<string>('search-algorithm', 'basic');
  return useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    if (algo === 'fuzzy') return products.filter((p) => fuzzyMatch(p.name, q) || fuzzyMatch(p.category, q));
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [query, algo]);
}
