import { useCallback, useEffect, useRef } from 'react';

export function useInteraction() {
  const revision = useRef(0);
  const locked = useRef(false);
  const lifetime = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;

    return () => controller.abort();
  }, []);

  const invalidate = useCallback(() => ++revision.current, []);

  return { revision, locked, lifetime, invalidate };
}

export type Interaction = ReturnType<typeof useInteraction>;
