import { useSearchParams } from 'react-router-dom';

const ON_VALUES = new Set(['1', 'true', 'on', 'yes']);

export function useRequestQueue() {
  const [searchParams] = useSearchParams();
  const raw = (searchParams.get('requests') || '').toLowerCase();
  const requestsEnabled = ON_VALUES.has(raw);

  const query = searchParams.toString();
  const querySuffix = query ? `?${query}` : '';

  return {
    requestsEnabled,
    withParams: (path) => `${path}${querySuffix}`,
  };
}
