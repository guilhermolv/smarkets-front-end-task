import { PointerEvent, useRef, useState } from 'react';
import { formatDateTime, formatEventType } from '../../lib/format';
import type { EventSummary } from '../../lib/schemas';
import './EventCarousel.scss';

type EventCarouselProps = {
  events: EventSummary[];
  onSelectEvent: (eventId: string) => void;
};

export function EventCarousel({ events, onSelectEvent }: EventCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ pointerId: number; x: number; scrollLeft: number } | null>(null);
  const hasDragged = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  function scrollByCards(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    const isAtStart = rail.scrollLeft <= 4;
    const isAtEnd = rail.scrollLeft >= maxScrollLeft - 4;

    if (direction === -1 && isAtStart) {
      rail.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
      return;
    }

    if (direction === 1 && isAtEnd) {
      rail.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    rail.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!railRef.current) return;

    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      scrollLeft: railRef.current.scrollLeft,
    };
    hasDragged.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!railRef.current || !dragStart.current) return;

    const delta = event.clientX - dragStart.current.x;
    if (Math.abs(delta) <= 6) return;

    if (!hasDragged.current) {
      hasDragged.current = true;
      setIsDragging(true);
      railRef.current.setPointerCapture(event.pointerId);
    }

    railRef.current.scrollLeft = dragStart.current.scrollLeft - delta;
  }

  function endDrag() {
    dragStart.current = null;
    window.setTimeout(() => setIsDragging(false), 80);
  }

  return (
    <div className="carousel-shell">
      <div className="carousel-controls" aria-label="Featured event carousel controls">
        <button className="carousel-control" type="button" onClick={() => scrollByCards(-1)} aria-label="Scroll featured events left">
          ‹
        </button>
        <button className="carousel-control" type="button" onClick={() => scrollByCards(1)} aria-label="Scroll featured events right">
          ›
        </button>
      </div>
      <div
        className={isDragging ? 'event-carousel event-carousel-dragging' : 'event-carousel'}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        ref={railRef}
      >
        {events.map((event) => (
          <button
            className="carousel-card"
            key={event.id}
            type="button"
            onClick={(clickEvent) => {
              if (hasDragged.current) {
                clickEvent.preventDefault();
                hasDragged.current = false;
                return;
              }

              onSelectEvent(event.id);
            }}
          >
            <span>{formatEventType(event.type)}</span>
            <strong>{event.name}</strong>
            <small>{formatDateTime(event.startDateTime)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
