'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const THRESHOLD = 80;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    setPullDistance(distance);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (pullDistance === 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;
  const scale = 0.5 + progress * 0.5;
  const opacity = progress;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ height: `${pullDistance}px` }}
    >
      <div
        className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: pullingRef.current ? 'none' : 'all 0.2s ease-out',
        }}
      >
        {refreshing ? (
          <svg
            className="h-5 w-5 animate-spin text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: pullingRef.current ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
