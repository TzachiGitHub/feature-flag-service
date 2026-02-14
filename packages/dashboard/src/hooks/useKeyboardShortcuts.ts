import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  /** If true, prevent default browser behavior */
  preventDefault?: boolean;
  /** Description for the shortcuts modal */
  description?: string;
}

export function useKeyboardShortcut(config: ShortcutConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input/textarea/select
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

    // For shortcuts like Cmd+S, still trigger in inputs
    const isModified = e.metaKey || e.ctrlKey;

    if (isInput && !isModified && config.key !== 'Escape') return;

    const keyMatch = e.key.toLowerCase() === config.key.toLowerCase();
    const ctrlMatch = config.ctrl ? (e.ctrlKey || e.metaKey) : true;
    const metaMatch = config.meta ? e.metaKey : true;
    const shiftMatch = config.shift ? e.shiftKey : !e.shiftKey;

    // For non-modifier shortcuts, make sure no modifiers are pressed
    if (!config.ctrl && !config.meta && (e.ctrlKey || e.metaKey || e.altKey)) return;

    if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
      if (config.preventDefault !== false) {
        e.preventDefault();
      }
      config.handler();
    }
  }, [config]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts({
  onNewFlag,
  onSearch,
  onShowShortcuts,
}: {
  onNewFlag?: () => void;
  onSearch?: () => void;
  onShowShortcuts?: () => void;
}) {
  useKeyboardShortcut({
    key: 'n',
    handler: () => onNewFlag?.(),
    description: 'Create new flag',
  });

  useKeyboardShortcut({
    key: '/',
    handler: () => onSearch?.(),
    description: 'Focus search',
  });

  useKeyboardShortcut({
    key: '?',
    shift: true,
    handler: () => onShowShortcuts?.(),
    description: 'Show keyboard shortcuts',
  });
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ['N'], description: 'Create new flag', scope: 'Flag List' },
  { keys: ['/'], description: 'Focus search', scope: 'Global' },
  { keys: ['T'], description: 'Toggle flag', scope: 'Flag Detail' },
  { keys: ['⌘', 'S'], description: 'Save changes', scope: 'Editing' },
  { keys: ['⇧', '?'], description: 'Show keyboard shortcuts', scope: 'Global' },
  { keys: ['Esc'], description: 'Close modal / dialog', scope: 'Global' },
];
