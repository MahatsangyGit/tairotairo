"use client";

import { useEffect, useRef } from "react";
import { apiFetchJson } from "@/lib/api-client";

const QUALIFY_MS = 3000;

type Props = {
  lessonId: string;
  src: string;
  onEnded?: () => void;
  onViewCounted?: (viewCount: number) => void;
};

export default function CourseVideoPlayer({
  lessonId,
  src,
  onEnded,
  onViewCounted,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sentRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sentRef.current = false;
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [lessonId]);

  function clearTimer() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  async function sendView() {
    if (sentRef.current) return;
    sentRef.current = true;
    try {
      const res = await apiFetchJson<{ counted: boolean; viewCount: number }>(
        `/api/learning/lessons/${lessonId}/view`,
        { method: "POST" }
      );
      onViewCounted?.(res.viewCount);
    } catch {
      sentRef.current = false;
    }
  }

  function scheduleView() {
    if (sentRef.current) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      void sendView();
    }, QUALIFY_MS);
  }

  return (
    <video
      ref={videoRef}
      key={lessonId}
      controls
      className="aspect-video w-full"
      src={src}
      onPlay={scheduleView}
      onPause={clearTimer}
      onEnded={() => {
        clearTimer();
        void sendView();
        onEnded?.();
      }}
    />
  );
}
