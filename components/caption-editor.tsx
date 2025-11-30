/**
 * CaptionEditor Component
 *
 * Container component that manages a list of captions.
 * Provides editing, validation, statistics, and bulk operations.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertCircle, CheckCircle2, FileText, Copy, Check, Undo2, Redo2 } from 'lucide-react';
import { CaptionCard } from './caption-card';
import type { Caption } from '@/lib/caption-utils';
import {
  updateCaption,
  deleteCaption,
  addCaption,
  validateAllCaptions,
  calculateStats,
  formatDuration,
  serializeCaptions,
} from '@/lib/caption-utils';

export interface CaptionEditorProps {
  /** Array of captions to edit */
  captions: Caption[];
  /** Callback when captions are updated */
  onCaptionsChange: (captions: Caption[]) => void;
  /** Current video playback time in milliseconds (for highlighting) */
  currentVideoTime?: number;
  /** Callback when user clicks a caption (for seeking video) */
  onCaptionClick?: (caption: Caption) => void;
  /** Undo function (optional) */
  onUndo?: () => void;
  /** Redo function (optional) */
  onRedo?: () => void;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
}

export function CaptionEditor({
  captions,
  onCaptionsChange,
  currentVideoTime,
  onCaptionClick,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CaptionEditorProps) {
  const [activeCaptionId, setActiveCaptionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Find caption that's active based on video time
  const videoCaptionId = currentVideoTime !== undefined
    ? captions.find(cap => currentVideoTime >= cap.start && currentVideoTime < cap.end)?.id || null
    : null;

  // Handle copy to clipboard
  const handleCopy = async (format: 'SRT' | 'VTT' = 'SRT') => {
    try {
      const captionText = serializeCaptions(captions, format);
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle caption update
  const handleUpdate = (id: string, updates: Partial<Omit<Caption, 'id'>>) => {
    const updated = updateCaption(captions, id, updates);
    onCaptionsChange(updated);
  };

  // Handle caption deletion
  const handleDelete = (id: string) => {
    const updated = deleteCaption(captions, id);
    onCaptionsChange(updated);
    if (activeCaptionId === id) {
      setActiveCaptionId(null);
    }
  };

  // Handle adding new caption
  const handleAddCaption = () => {
    // Calculate next start time (after last caption or at 0)
    const lastCaption = captions[captions.length - 1];
    const nextStart = lastCaption ? lastCaption.end : 0;
    const nextEnd = nextStart + 3000; // Default 3 second duration

    const updated = addCaption(captions, captions.length, {
      start: nextStart,
      end: nextEnd,
      text: '',
    });

    onCaptionsChange(updated);

    // Set the new caption as active
    if (updated.length > captions.length) {
      setActiveCaptionId(updated[updated.length - 1].id);
    }
  };

  // Calculate validation and statistics
  const validation = validateAllCaptions(captions);
  const stats = calculateStats(captions);

  return (
    <div className="space-y-4">
      {/* Header with statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Caption Editor
              </CardTitle>
              <CardDescription>Edit individual captions and timing</CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Undo/Redo controls */}
              {onUndo && onRedo && (
                <>
                  <Button
                    onClick={onUndo}
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={onRedo}
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                onClick={() => handleCopy('SRT')}
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={captions.length === 0}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy as SRT
                  </>
                )}
              </Button>
              <Button onClick={handleAddCaption} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Caption
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalCaptions}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Captions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Duration</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                stats.averageCPS > 21 ? 'text-red-600 dark:text-red-400' :
                stats.averageCPS > 17 ? 'text-yellow-600 dark:text-yellow-400' :
                stats.averageCPS >= 12 ? 'text-green-600 dark:text-green-400' :
                'text-zinc-900 dark:text-zinc-100'
              }`}>{stats.averageCPS.toFixed(1)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Avg CPS</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Avg Duration</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                validation.errors.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
              }`}>
                {validation.errors.length}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Errors</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                validation.warnings.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'
              }`}>
                {validation.warnings.length}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Warnings</div>
            </div>
          </div>

          {/* Validation Summary */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="mt-4 space-y-2">
              {validation.errors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{validation.errors.length} Errors</div>
                    <div className="text-xs mt-1 space-y-0.5">
                      {validation.errors.slice(0, 3).map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                      {validation.errors.length > 3 && (
                        <div>...and {validation.errors.length - 3} more</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {validation.warnings.length > 0 && validation.errors.length === 0 && (
                <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{validation.warnings.length} Warnings</div>
                    <div className="text-xs mt-1 space-y-0.5">
                      {validation.warnings.slice(0, 3).map((warn, idx) => (
                        <div key={idx}>• {warn}</div>
                      ))}
                      {validation.warnings.length > 3 && (
                        <div>...and {validation.warnings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {validation.isValid && validation.warnings.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <div className="font-semibold">All captions valid!</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Caption List */}
      {captions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No captions yet. Upload a video or caption file to get started.
            </p>
            <Button onClick={handleAddCaption} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Caption
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {captions.map((caption, index) => (
            <CaptionCard
              key={caption.id}
              caption={caption}
              index={index}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isActive={caption.id === activeCaptionId}
              isVideoActive={caption.id === videoCaptionId}
              onClick={() => {
                setActiveCaptionId(caption.id);
                // Also seek video to this caption if callback provided
                if (onCaptionClick) {
                  onCaptionClick(caption);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
