import { useState, useEffect } from 'react';

/**
 * Debounce a value. Useful for search inputs to reduce API calls.
 * Usage: const debouncedSearch = useDebounce(search, 300);
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
