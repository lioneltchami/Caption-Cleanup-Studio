/**
 * useHistory Hook
 *
 * Provides undo/redo functionality for state management.
 * Uses a stack-based approach with past, present, and future states.
 */

import { useState, useCallback, useRef } from 'react';

export interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

const MAX_HISTORY_SIZE = 50; // Limit history to prevent memory issues

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  // State stacks
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  // Track if we're in the middle of an undo/redo to prevent re-adding to history
  const isUndoRedoRef = useRef(false);

  // Set new state and add to history
  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    // Don't add to history if we're undoing/redoing
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setPresent((currentPresent) => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prevState: T) => T)(currentPresent)
        : newState;

      // Only add to history if state actually changed
      if (JSON.stringify(resolvedState) === JSON.stringify(currentPresent)) {
        return currentPresent;
      }

      // Add current state to past
      setPast((currentPast) => {
        const newPast = [...currentPast, currentPresent];
        // Limit history size
        if (newPast.length > MAX_HISTORY_SIZE) {
          return newPast.slice(1);
        }
        return newPast;
      });

      // Clear future (new change invalidates redo)
      setFuture([]);

      return resolvedState;
    });
  }, []);

  // Undo: move current state to future, restore from past
  const undo = useCallback(() => {
    if (past.length === 0) return;

    isUndoRedoRef.current = true;

    const newPast = [...past];
    const newPresent = newPast.pop()!;

    setPast(newPast);
    setFuture((currentFuture) => [present, ...currentFuture]);
    setPresent(newPresent);
  }, [past, present]);

  // Redo: move current state to past, restore from future
  const redo = useCallback(() => {
    if (future.length === 0) return;

    isUndoRedoRef.current = true;

    const newFuture = [...future];
    const newPresent = newFuture.shift()!;

    setFuture(newFuture);
    setPast((currentPast) => [...currentPast, present]);
    setPresent(newPresent);
  }, [future, present]);

  // Clear all history
  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
  };
}
