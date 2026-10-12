import { useState } from 'react';

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage]   = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const goToPage    = (p) => setPage(p);
  const nextPage    = ()  => setPage((p) => p + 1);
  const prevPage    = ()  => setPage((p) => Math.max(1, p - 1));
  const resetPage   = ()  => setPage(1);
  const changeLimit = (l) => { setLimit(l); setPage(1); };

  return { page, limit, goToPage, nextPage, prevPage, resetPage, changeLimit };
}
