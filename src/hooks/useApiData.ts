import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api, ApiError, subscribeApiTenantChanges } from '../lib/api';

export interface ApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetches an API endpoint and exposes { data, loading, error, reload }.
 * Re-fetches automatically whenever `path` or any item of `deps` changes.
 * Passing `null` as path disables fetching (useful for conditional loads).
 */
export function useApiData<T = unknown>(
  path: string | null,
  deps: unknown[] = []
): ApiDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);

  useEffect(() => subscribeApiTenantChanges(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((result) => {
        if (requestId.current === id) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (requestId.current === id) {
          const message =
            err instanceof ApiError ? err.message : 'Something went wrong fetching data';
          setError(message);
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}
