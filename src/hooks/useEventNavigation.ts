import { useCallback, useEffect, useRef, useState } from 'react';
import { exchangePath, readCategoryFromSearch, readEventIdFromPath } from '../lib/navigation';

export function useEventNavigation() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => readEventIdFromPath());
  const [selectedCategory, setSelectedCategory] = useState(() => readCategoryFromSearch());
  const selectedCategoryRef = useRef(selectedCategory);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  const syncFromLocation = useCallback(() => {
    setSelectedEventId(readEventIdFromPath());
    setSelectedCategory(readCategoryFromSearch());
  }, []);

  const navigateToEvent = useCallback((eventId: string) => {
    window.history.pushState(null, '', exchangePath(eventId, selectedCategoryRef.current));
    setSelectedEventId(eventId);
  }, []);

  const navigateToHomepage = useCallback(() => {
    window.history.pushState(null, '', exchangePath(null, selectedCategoryRef.current));
    setSelectedEventId(null);
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    selectedCategoryRef.current = categoryId;
    window.history.pushState(null, '', exchangePath(null, categoryId));
    setSelectedCategory(categoryId);
    setSelectedEventId(null);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [syncFromLocation]);

  return { selectedEventId, selectedCategory, navigateToEvent, navigateToHomepage, selectCategory };
}
