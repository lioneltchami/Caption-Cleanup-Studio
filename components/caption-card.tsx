/**
 * CaptionCard Component
 *
 * Displays and allows editing of a single caption entry.
 * Shows validation warnings, allows text and timing edits, and includes delete functionality.
 */

'use client';

import { useState } from 'react';
import {  Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import type { Caption } from '@/lib/caption-utils';
import { msToSrtTime, srtTimeToMs, validateCaption } from '@/lib/caption-utils';

export interface CaptionCardProps {
  /** Caption data to display */
  caption: Caption;
  /** Caption index (for display and validation) */
  index: number;
  /** Callback when caption is updated */
  onUpdate: (id: string, updates: Partial<Omit<Caption, 'id'>>) => void;
  /** Callback when caption is deleted */
  onDelete: (id: string) => void;
  /** Whether the caption is currently selected/active (clicked by user) */
  isActive?: boolean;
  /** Whether the caption is currently playing in video */
  isVideoActive?: boolean;
  /** Callback when caption card is clicked */
  onClick?: () => void;
}

export function CaptionCard({
  caption,
  index,
  onUpdate,
  onDelete,
  isActive = false,
  isVideoActive = false,
  onClick,
}: CaptionCardProps) {
  // Local state for time editing
  const [startTimeStr, setStartTimeStr] = useState(msToSrtTime(caption.start));
  const [endTimeStr, setEndTimeStr] = useState(msToSrtTime(caption.end));
  const [isEditingTime, setIsEditingTime] = useState(false);

  // Validate caption
  const validation = validateCaption(caption, index);
  const hasWarnings = validation.warnings.length > 0;
  const hasErrors = validation.errors.length > 0;

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(caption.id, { text: e.target.value });
  };

  // Handle start time change
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTimeStr(e.target.value);
  };

  // Handle end time change
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTimeStr(e.target.value);
  };

  // Apply time changes
  const applyTimeChanges = () => {
    try {
      const newStart = srtTimeToMs(startTimeStr);
      const newEnd = srtTimeToMs(endTimeStr);

      onUpdate(caption.id, { start: newStart, end: newEnd });
      setIsEditingTime(false);
    } catch (error) {
      // Invalid time format - revert
      setStartTimeStr(msToSrtTime(caption.start));
      setEndTimeStr(msToSrtTime(caption.end));
      setIsEditingTime(false);
    }
  };

  // Cancel time editing
  const cancelTimeEditing = () => {
    setStartTimeStr(msToSrtTime(caption.start));
    setEndTimeStr(msToSrtTime(caption.end));
    setIsEditingTime(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (confirm(`Delete caption ${index + 1}?`)) {
      onDelete(caption.id);
    }
  };

  // Calculate duration and CPS
  const duration = (caption.end - caption.start) / 1000; // seconds
  const cps = duration > 0 ? caption.text.length / duration : 0;

  return (
    <Card
      className={`transition-all cursor-pointer ${
        isVideoActive
          ? 'ring-2 ring-green-500 shadow-lg bg-green-50/50 dark:bg-green-900/10'
          : isActive
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${hasErrors ? 'border-red-500' : hasWarnings ? 'border-yellow-500' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with index, duration, and delete button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              #{index + 1}
            </span>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>{duration.toFixed(1)}s</span>
              <span className="mx-1">·</span>
              <span>{cps.toFixed(1)} cps</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Validation warnings/errors */}
        {(hasWarnings || hasErrors) && (
          <div
            className={`text-xs p-2 rounded-md ${
              hasErrors
                ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-400'
                : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400'
            }`}
          >
            <div className="flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                {validation.errors.map((err, idx) => (
                  <div key={`err-${idx}`}>{err}</div>
                ))}
                {validation.warnings.map((warn, idx) => (
                  <div key={`warn-${idx}`}>{warn}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timing controls */}
        <div className="space-y-2">
          {!isEditingTime ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTime(true);
              }}
              className="w-full text-xs text-left text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-mono"
            >
              {msToSrtTime(caption.start)} → {msToSrtTime(caption.end)}
            </button>
          ) : (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-400">Start</label>
                  <Input
                    value={startTimeStr}
                    onChange={handleStartTimeChange}
                    className="font-mono text-xs h-8"
                    placeholder="00:00:00,000"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-400">End</label>
                  <Input
                    value={endTimeStr}
                    onChange={handleEndTimeChange}
                    className="font-mono text-xs h-8"
                    placeholder="00:00:00,000"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={applyTimeChanges}
                  size="sm"
                  variant="default"
                  className="h-7 text-xs flex-1"
                >
                  Apply
                </Button>
                <Button
                  onClick={cancelTimeEditing}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Caption text */}
        <Textarea
          value={caption.text}
          onChange={handleTextChange}
          onClick={(e) => e.stopPropagation()}
          className="min-h-[80px] font-mono text-sm resize-none"
          placeholder="Caption text..."
        />

        {/* Character count */}
        <div className="text-xs text-zinc-500 text-right">
          {caption.text.length} characters
          {caption.text.split('\n').length > 1 && (
            <span className="ml-2">· {caption.text.split('\n').length} lines</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
