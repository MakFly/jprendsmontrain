"use client";

import { useCallback, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 70; // px of (resisted) pull needed to trigger a refresh
const MAX_PULL = 120; // px the indicator can stretch to
const RESIST = 0.5; // rubber-band factor so the pull feels weighty

// Mobile-style pull-to-refresh. The document scrolls on `window` (body), so a
// gesture only counts when we're at the very top (scrollY === 0). On release
// past the threshold it awaits `onRefresh` and shows a spinner until it
// settles. Native browser pull-to-refresh is already disabled via
// `overscroll-behavior-y: none` in globals.css, so the two don't fight.
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing || window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? null;
      dragging.current = true;
    },
    [refreshing],
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
    // Only a downward pull from the top counts; anything else cancels it.
    if (dy <= 0 || window.scrollY > 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX_PULL, dy * RESIST));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;
    dragging.current = false;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {
        /* failures surface through the pages' own error states */
      }
      setRefreshing(false);
    }
    setPull(0);
  }, [pull, refreshing, onRefresh]);

  const height = refreshing ? THRESHOLD : pull;
  const ratio = Math.min(1, height / THRESHOLD);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        aria-hidden
        className="flex items-center justify-center overflow-hidden"
        style={{
          height,
          transition: dragging.current ? "none" : "height 0.25s ease",
        }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-muted-foreground",
            refreshing && "animate-spin",
          )}
          style={{
            opacity: ratio,
            transform: refreshing ? undefined : `rotate(${height * 3}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
