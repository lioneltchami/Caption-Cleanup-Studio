/**
 * Caption Editor Utilities
 *
 * TypeScript utilities for parsing, manipulating, and serializing caption files (SRT/VTT).
 * Uses the 'subtitle' npm package for parsing and stringification.
 */

import { parseSync, stringifySync } from 'subtitle';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Caption object representing a single subtitle entry
 * (Simplified structure for editing)
 */
export interface Caption {
  /** Unique identifier for this caption (generated, not from SRT) */
  id: string;
  /** Start time in milliseconds */
  start: number;
  /** End time in milliseconds */
  end: number;
  /** Caption text content */
  text: string;
}

/**
 * Validation result for a caption
 */
export interface CaptionValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Caption statistics
 */
export interface CaptionStats {
  totalCaptions: number;
  totalDuration: number; // milliseconds
  averageDuration: number; // milliseconds per caption
  averageCPS: number; // characters per second
  longestCaption: number; // character count
  shortestCaption: number; // character count
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse SRT or VTT caption text into Caption objects
 *
 * @param captionText - Raw SRT or VTT text
 * @returns Array of Caption objects
 * @throws Error if parsing fails
 */
export function parseCaptions(captionText: string): Caption[] {
  try {
    // Clean up the input text
    const cleaned = captionText
      .split('\n')
      .map(line => line.trimStart()) // Remove leading spaces from each line
      .join('\n')
      .trim();

    const parsed = parseSync(cleaned);

    return parsed
      .filter(node => node.type === 'cue') // Only get cue nodes (ignore meta nodes)
      .map((node, index) => ({
        id: `caption-${Date.now()}-${index}`, // Generate unique ID
        start: node.data.start,
        end: node.data.end,
        text: node.data.text,
      }));
  } catch (error) {
    throw new Error(`Failed to parse captions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect caption format (SRT or VTT)
 *
 * @param captionText - Raw caption text
 * @returns 'SRT' | 'VTT' | 'UNKNOWN'
 */
export function detectFormat(captionText: string): 'SRT' | 'VTT' | 'UNKNOWN' {
  if (captionText.trim().startsWith('WEBVTT')) {
    return 'VTT';
  }

  // SRT format typically starts with number 1, then timestamp
  // Use \r?\n to handle both Unix and Windows line endings
  if (/^\s*1\s*[\r\n]+\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(captionText)) {
    return 'SRT';
  }

  // Also check if it contains SRT-style timestamps anywhere
  if (/\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(captionText)) {
    return 'SRT';
  }

  return 'UNKNOWN';
}

// ============================================================================
// SERIALIZATION FUNCTIONS
// ============================================================================

/**
 * Convert Caption objects back to SRT or VTT format
 *
 * @param captions - Array of Caption objects
 * @param format - Output format ('SRT' or 'VTT')
 * @returns Formatted caption text
 */
export function serializeCaptions(captions: Caption[], format: 'SRT' | 'VTT' = 'SRT'): string {
  try {
    // Convert our Caption format to subtitle library format
    const subtitleNodes = captions.map(cap => ({
      type: 'cue' as const,
      data: {
        start: cap.start,
        end: cap.end,
        text: cap.text,
      },
    }));

    return stringifySync(subtitleNodes, { format });
  } catch (error) {
    throw new Error(`Failed to serialize captions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// TIME CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert milliseconds to SRT time format (HH:MM:SS,mmm)
 *
 * @param ms - Time in milliseconds
 * @returns SRT formatted time string
 */
export function msToSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Convert SRT time format to milliseconds
 *
 * @param timeStr - SRT time string (HH:MM:SS,mmm)
 * @returns Time in milliseconds
 */
export function srtTimeToMs(timeStr: string): number {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) {
    throw new Error(`Invalid SRT time format: ${timeStr}`);
  }

  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(seconds) * 1000 +
    parseInt(milliseconds)
  );
}

/**
 * Format duration in human-readable format
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "1h 23m 45s")
 */
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single caption for common issues
 *
 * @param caption - Caption to validate
 * @param index - Caption index (for error messages)
 * @returns Validation result
 */
export function validateCaption(caption: Caption, index: number): CaptionValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check timing
  if (caption.start >= caption.end) {
    errors.push(`Caption ${index + 1}: Start time must be before end time`);
  }

  if (caption.start < 0 || caption.end < 0) {
    errors.push(`Caption ${index + 1}: Time cannot be negative`);
  }

  // Check text
  if (!caption.text || caption.text.trim().length === 0) {
    warnings.push(`Caption ${index + 1}: Empty text`);
  }

  // Check duration (industry standard: min 1s, max 6s)
  const duration = (caption.end - caption.start) / 1000; // seconds
  if (duration < 1) {
    warnings.push(`Caption ${index + 1}: Duration too short (${duration.toFixed(2)}s, min recommended: 1s)`);
  }
  if (duration > 6) {
    warnings.push(`Caption ${index + 1}: Duration too long (${duration.toFixed(1)}s, max recommended: 6s)`);
  }

  // Check line count (industry standard: max 2 lines on screen)
  const lines = caption.text.split('\n');
  if (lines.length > 2) {
    errors.push(`Caption ${index + 1}: Too many lines (${lines.length} lines, max: 2)`);
  }

  // Check character count per line (industry standard: max 42 characters per line)
  lines.forEach((line, lineIdx) => {
    if (line.length > 42) {
      warnings.push(`Caption ${index + 1}, Line ${lineIdx + 1}: Exceeds 42 characters (${line.length} chars)`);
    }
  });

  // Check CPS (characters per second)
  // Industry standards: 12-17 optimal, 17-21 acceptable, 21+ too fast
  const chars = caption.text.length;
  const cps = duration > 0 ? chars / duration : Infinity;

  if (cps > 21) {
    errors.push(`Caption ${index + 1}: Reading speed too fast (${cps.toFixed(1)} CPS, max: 21)`);
  } else if (cps > 17) {
    warnings.push(`Caption ${index + 1}: Reading speed fast (${cps.toFixed(1)} CPS, optimal: 12-17)`);
  } else if (cps < 12 && duration > 1) {
    warnings.push(`Caption ${index + 1}: Reading speed slow (${cps.toFixed(1)} CPS, optimal: 12-17)`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate all captions and check for timing overlaps
 *
 * @param captions - Array of captions to validate
 * @returns Combined validation result
 */
export function validateAllCaptions(captions: Caption[]): CaptionValidation {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  // Validate each caption individually
  captions.forEach((caption, index) => {
    const result = validateCaption(caption, index);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
  });

  // Check for timing overlaps and minimum gaps
  // Industry standard: minimum 0.1s (100ms) gap between captions
  const MIN_GAP_MS = 100; // 0.1 seconds

  for (let i = 0; i < captions.length - 1; i++) {
    const current = captions[i];
    const next = captions[i + 1];

    // Check for overlap (serious error)
    if (current.end > next.start) {
      const overlapMs = current.end - next.start;
      allErrors.push(`Captions ${i + 1} and ${i + 2}: Timing overlap (${overlapMs}ms)`);
    }
    // Check for minimum gap (warning)
    else if (next.start - current.end < MIN_GAP_MS) {
      const gapMs = next.start - current.end;
      allWarnings.push(`Captions ${i + 1} and ${i + 2}: Gap too small (${gapMs}ms, min recommended: ${MIN_GAP_MS}ms)`);
    }
  }

  return {
    isValid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
  };
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/**
 * Calculate statistics for a caption array
 *
 * @param captions - Array of captions
 * @returns Caption statistics
 */
export function calculateStats(captions: Caption[]): CaptionStats {
  if (captions.length === 0) {
    return {
      totalCaptions: 0,
      totalDuration: 0,
      averageDuration: 0,
      averageCPS: 0,
      longestCaption: 0,
      shortestCaption: 0,
    };
  }

  let totalDuration = 0;
  let totalChars = 0;
  let longestCaption = 0;
  let shortestCaption = Infinity;

  captions.forEach(cap => {
    const duration = cap.end - cap.start;
    const chars = cap.text.length;

    totalDuration += duration;
    totalChars += chars;
    longestCaption = Math.max(longestCaption, chars);
    shortestCaption = Math.min(shortestCaption, chars);
  });

  const averageDuration = totalDuration / captions.length;
  const averageCPS = totalDuration > 0 ? (totalChars / (totalDuration / 1000)) : 0;

  return {
    totalCaptions: captions.length,
    totalDuration,
    averageDuration,
    averageCPS,
    longestCaption,
    shortestCaption: shortestCaption === Infinity ? 0 : shortestCaption,
  };
}

// ============================================================================
// MANIPULATION FUNCTIONS
// ============================================================================

/**
 * Add a new caption at a specific index
 *
 * @param captions - Current caption array
 * @param index - Index to insert at
 * @param newCaption - New caption to add (without ID)
 * @returns Updated caption array
 */
export function addCaption(
  captions: Caption[],
  index: number,
  newCaption: Omit<Caption, 'id'>
): Caption[] {
  const caption: Caption = {
    ...newCaption,
    id: `caption-${Date.now()}-${Math.random()}`,
  };

  const updated = [...captions];
  updated.splice(index, 0, caption);
  return updated;
}

/**
 * Update an existing caption
 *
 * @param captions - Current caption array
 * @param id - Caption ID to update
 * @param updates - Partial caption updates
 * @returns Updated caption array
 */
export function updateCaption(
  captions: Caption[],
  id: string,
  updates: Partial<Omit<Caption, 'id'>>
): Caption[] {
  return captions.map(cap =>
    cap.id === id ? { ...cap, ...updates } : cap
  );
}

/**
 * Delete a caption by ID
 *
 * @param captions - Current caption array
 * @param id - Caption ID to delete
 * @returns Updated caption array
 */
export function deleteCaption(captions: Caption[], id: string): Caption[] {
  return captions.filter(cap => cap.id !== id);
}

/**
 * Reorder captions (for drag-and-drop)
 *
 * @param captions - Current caption array
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @returns Reordered caption array
 */
export function reorderCaptions(
  captions: Caption[],
  fromIndex: number,
  toIndex: number
): Caption[] {
  const updated = [...captions];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}
