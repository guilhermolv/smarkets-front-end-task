import { categories } from '../constants/categories';

export function readEventIdFromPath(pathname = window.location.pathname) {
  const match = pathname.match(/^\/events\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function readCategoryFromSearch(search = window.location.search) {
  const category = new URLSearchParams(search).get('category');
  return categories.find((item) => item.id === category)?.id ?? 'all';
}

export function exchangePath(eventId: string | null, category: string) {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  const query = params.toString();
  const path = eventId ? `/events/${encodeURIComponent(eventId)}` : '/';
  return query ? `${path}?${query}` : path;
}
