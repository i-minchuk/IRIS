import { useState, useEffect, useRef, useCallback } from 'react';

interface UseApiDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

interface UseApiDataReturn<T> extends UseApiDataState<T> {
  refetch: () => void;
}

/**
 * Хук для загрузки данных из API с fallback на mock-данные.
 * Загрузка начинается автоматически при монтировании.
 *
 * @param fetcher — async функция, возвращающая данные
 * @param fallback — данные по умолчанию (mock), пока идёт загрузка или при ошибке
 * @param deps — зависимости для перезагрузки (опционально)
 * @returns { data, loading, error, refetch }
 *
 * @example
 * const { data: tasks, loading, error, refetch } = useApiData(
 *   () => getTasks(),
 *   mockTasks,
 *   [projectId]
 * );
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: React.DependencyList = []
): UseApiDataReturn<T> {
  const [state, setState] = useState<UseApiDataState<T>>({
    data: fallback,
    loading: false,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки';
          setState((prev) => ({ ...prev, loading: false, error: message }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refetch: load,
  };
}

/**
 * Хук для отложенной загрузки данных (lazy fetch).
 * Загрузка НЕ начинается автоматически — нужно вызвать refetch().
 *
 * @param fetcher — async функция
 * @param initial — начальное состояние данных
 * @returns { data, loading, error, refetch }
 *
 * @example
 * const { data, loading, refetch } = useLazyApiData(
 *   () => getTasks(),
 *   mockTasks
 * );
 * // вызвать refetch() когда таб станет активным
 */
export function useLazyApiData<T>(
  fetcher: () => Promise<T>,
  initial: T
): UseApiDataReturn<T> {
  const [state, setState] = useState<UseApiDataState<T>>({
    data: initial,
    loading: false,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки';
          setState((prev) => ({ ...prev, loading: false, error: message }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    refetch,
  };
}
