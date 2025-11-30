/**
 * VideoPlayer Component
 *
 * HTML5 video player with caption overlay and time synchronization.
 * Displays current caption based on playback position.
 */

'use client';

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Caption } from '@/lib/caption-utils';
import { Card } from '@/components/ui/card';

export interface VideoPlayerProps {
  /** Video source URL (blob URL or file URL) */
  videoSrc: string;
  /** Array of caption objects to display */
  captions: Caption[];
  /** Callback when video time updates */
  onTimeUpdate?: (time: number) => void;
  /** Optional CSS class */
  className?: string;
}

export interface VideoPlayerRef {
  /** Seek to a specific time in milliseconds */
  seekTo: (timeMs: number) => void;
  /** Get current video time in milliseconds */
  getCurrentTime: () => number;
  /** Play the video */
  play: () => void;
  /** Pause the video */
  pause: () => void;
}

/**
 * Find the index of the active caption at a given time
 */
function findActiveCaptionIndex(captions: Caption[], currentTimeMs: number): number | null {
  for (let i = 0; i < captions.length; i++) {
    if (currentTimeMs >= captions[i].start && currentTimeMs < captions[i].end) {
      return i;
    }
  }
  return null;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoSrc, captions, onTimeUpdate, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0); // in milliseconds
    const [duration, setDuration] = useState(0); // in milliseconds
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeCaptionIndex, setActiveCaptionIndex] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      seekTo: (timeMs: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = timeMs / 1000; // Convert ms to seconds
        }
      },
      getCurrentTime: () => currentTime,
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
    }));

    // Handle time update from video
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        const timeMs = video.currentTime * 1000; // Convert seconds to milliseconds
        setCurrentTime(timeMs);

        // Find active caption
        const activeIndex = findActiveCaptionIndex(captions, timeMs);
        setActiveCaptionIndex(activeIndex);

        // Notify parent
        if (onTimeUpdate) {
          onTimeUpdate(timeMs);
        }
      };

      const handleLoadedMetadata = () => {
        setDuration(video.duration * 1000); // Convert to milliseconds
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleError = () => {
        setError('Failed to load video. Please check the file format.');
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('error', handleError);
      };
    }, [captions, onTimeUpdate]);

    // Get current caption text
    const currentCaption = activeCaptionIndex !== null ? captions[activeCaptionIndex] : null;

    return (
      <Card className={`relative overflow-hidden ${className}`}>
        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="relative bg-black">
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            className="w-full max-h-[600px] object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>

          {/* Caption Overlay */}
          {currentCaption && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 max-w-[85%] pointer-events-none">
              <div className="bg-black/75 text-white px-4 py-2 rounded text-center text-base sm:text-lg leading-relaxed shadow-lg">
                {currentCaption.text}
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              {activeCaptionIndex !== null && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Caption {activeCaptionIndex + 1} of {captions.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-zinc-400'}`} />
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

/**
 * Format time in milliseconds to HH:MM:SS or MM:SS
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
