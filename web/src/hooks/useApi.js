import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';

// Simple data fetcher with loading/error/refetch.
// Usage: const { data, loading, error, refetch } = useApi('/patients?limit=20');
export function useApi(url, { enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const cancelRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!url || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      if (!cancelRef.current) setData(res.data);
    } catch (err) {
      if (!cancelRef.current) setError(err.response?.data?.message || err.message);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  useEffect(() => {
    cancelRef.current = false;
    refetch();
    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, ...deps]);

  return { data, loading, error, refetch, setData };
}
