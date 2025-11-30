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
import { Plus, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { CaptionCard } from './caption-card';
import type { Caption } from '@/lib/caption-utils';
import {
  updateCaption,
  deleteCaption,
  addCaption,
  validateAllCaptions,
  calculateStats,
  formatDuration,
} from '@/lib/caption-utils';

export interface CaptionEditorProps {
  /** Array of captions to edit */
  captions: Caption[];
  /** Callback when captions are updated */
  onCaptionsChange: (captions: Caption[]) => void;
}

export function CaptionEditor({ captions, onCaptionsChange }: CaptionEditorProps) {
  const [activeCaptionId, setActiveCaptionId] = useState<string | null>(null);

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
            <Button onClick={handleAddCaption} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Caption
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalCaptions}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Captions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.averageCPS.toFixed(1)}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Avg CPS</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.longestCaption > 0 ? stats.longestCaption : '-'}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Longest (chars)</div>
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
              onClick={() => setActiveCaptionId(caption.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
