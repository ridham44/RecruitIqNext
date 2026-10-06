'use client';

import { useCallback, useMemo } from 'react';
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

// Small typed helpers over next/navigation so page code keeps a compact,
// familiar API:
//   const navigate = useNavigate();  navigate('/x'); navigate('/x', { replace: true }); navigate(-1);
//   const { id } = useParams();
//   const [searchParams, setSearchParams] = useSearchParams();

export interface NavigateOptions {
  replace?: boolean;
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, options: NavigateOptions = {}) => {
      if (typeof to === 'number') {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      if (options.replace) router.replace(to);
      else router.push(to);
    },
    [router]
  );
}

// Route params are always single path segments here (no catch-all routes in
// the UI), so they're typed as plain strings.
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return (useNextParams() || {}) as unknown as T;
}

type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInit, options?: NavigateOptions) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const current = useNextSearchParams();
  const params = useMemo(() => new URLSearchParams(current?.toString() || ''), [current]);

  const setParams = useCallback(
    (next: SearchParamsInit, options: NavigateOptions = {}) => {
      const query = new URLSearchParams(next as Record<string, string>).toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname]
  );

  return [params, setParams];
}
