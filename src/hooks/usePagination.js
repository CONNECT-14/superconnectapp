import { useState, useRef, useEffect, useCallback } from 'react';

export default function usePagination(fetchFunction, pageSize = 10, dependencies = []) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef(null);

  const resetAndFetch = useCallback(async () => {
    setLoading(true);
    setHasMore(true);
    setOffset(0);
    
    try {
      const newItems = await fetchFunction(0, pageSize);
      setItems(newItems || []);
      if (!newItems || newItems.length < pageSize) {
        setHasMore(false);
      }
      setOffset(pageSize);
    } catch (error) {
      console.error("Pagination fetch error:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize, ...dependencies]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextItems = await fetchFunction(offset, pageSize);
      if (!nextItems || nextItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...nextItems]);
        setOffset(prev => prev + pageSize);
        if (nextItems.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Pagination load more error:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, loading, hasMore, offset, pageSize]);

  // Initial fetch when dependencies change
  useEffect(() => {
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, { threshold: 0.1 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loading, loadMore]);

  return { items, setItems, loading, hasMore, sentinelRef, loadMore, resetAndFetch };
}
