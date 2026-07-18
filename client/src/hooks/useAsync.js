import { useState, useEffect, useCallback } from "react";

// Runs an async function on mount, tracking loading/error/data and exposing a
// reload(). Standardizes how pages fetch from the API.
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then((result) => setData(result))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}
