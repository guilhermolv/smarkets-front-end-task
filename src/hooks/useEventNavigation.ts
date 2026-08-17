import { useCallback, useEffect, useState } from 'react';
import { readEventIdFromPath } from '../lib/navigation';

export function useEventNavigation() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => readEventIdFromPath());

  const navigateToEvent = useCallback((eventId: string) => {
    window.history.pushState(null, '', `/events/${encodeURIComponent(eventId)}`);
    setSelectedEventId(eventId);
  }, []);

  const navigateToHomepage = useCallback(() => {
    window.history.pushState(null, '', '/');
    setSelectedEventId(null);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setSelectedEventId(readEventIdFromPath());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { selectedEventId, navigateToEvent, navigateToHomepage };
}
