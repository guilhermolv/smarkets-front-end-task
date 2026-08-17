export function readEventIdFromPath() {
  const match = window.location.pathname.match(/^\/events\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
