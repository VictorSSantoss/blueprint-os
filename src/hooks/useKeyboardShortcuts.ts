import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface KeyboardShortcutOnKeyUp {
  key: string;
  action: () => void;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  onKeyUp?: KeyboardShortcutOnKeyUp[];
  ignoreInputs?: boolean;
}

function matchesModifiers(
  event: KeyboardEvent,
  modifiers?: KeyboardShortcut['modifiers']
): boolean {
  if (!modifiers) {
    return !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  const ctrlOrMeta = modifiers.ctrl || modifiers.meta;
  const eventCtrlOrMeta = event.ctrlKey || event.metaKey;

  if (ctrlOrMeta && !eventCtrlOrMeta) return false;
  if (!ctrlOrMeta && eventCtrlOrMeta) return false;
  if (modifiers.shift && !event.shiftKey) return false;
  if (!modifiers.shift && event.shiftKey) return false;
  if (modifiers.alt && !event.altKey) return false;
  if (!modifiers.alt && event.altKey) return false;

  return true;
}

export function useKeyboardShortcuts({
  shortcuts,
  onKeyUp,
  ignoreInputs = true,
}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts);
  const onKeyUpRef = useRef(onKeyUp);

  shortcutsRef.current = shortcuts;
  onKeyUpRef.current = onKeyUp;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (ignoreInputs) {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
      }

      const key = event.key.toLowerCase();

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const shortcutKey = shortcut.key.toLowerCase();
        if (key !== shortcutKey) continue;

        if (!matchesModifiers(event, shortcut.modifiers)) continue;

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.action();
        return;
      }
    },
    [ignoreInputs]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!onKeyUpRef.current) return;

    const key = event.key.toLowerCase();

    for (const shortcut of onKeyUpRef.current) {
      if (shortcut.enabled === false) continue;

      const shortcutKey = shortcut.key.toLowerCase();
      if (key !== shortcutKey) continue;

      shortcut.action();
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
