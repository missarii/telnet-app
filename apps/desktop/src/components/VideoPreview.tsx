import React, { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  sourceId: string;
  sourceName: string;
}

/**
 * VideoPreview — captures a screen source by ID using getDisplayMedia/desktopCapturer
 * and renders it in a <video> element (video only, never audio).
 */
export default function VideoPreview({ sourceId, sourceName }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!sourceId) return;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        // Electron exposes desktopCapturer sources via chromeMediaSource
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // @ts-ignore — Electron-specific constraint
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30,
            },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error('VideoPreview: failed to start capture', err);
      }
    };

    start();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [sourceId]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[var(--border)]">
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      {/* PREVIEW badge */}
      <div className="absolute top-2 left-2">
        <span className="bg-black/60 backdrop-blur-sm text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded">
          PREVIEW · {sourceName}
        </span>
      </div>
    </div>
  );
}
