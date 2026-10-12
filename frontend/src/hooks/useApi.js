import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for API calls with loading/error state
 */
export function useApi(apiFn, params = null, immediate = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data?.data ?? res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  useEffect(() => {
    if (immediate) {
      if (params !== null) execute(params);
      else execute();
    }
  }, []);

  return { data, loading, error, execute, setData };
}
