/**
 * 键盘快捷键帮助组件
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Keyboard, X } from 'lucide-react';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { getShortcutDisplayText } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsContextType {
  showHelp: () => void;
  registerShortcuts: (shortcuts: KeyboardShortcut[]) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcutsHelp() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    return { showHelp: () => {}, registerShortcuts: () => {} };
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  const showHelp = useCallback(() => setIsOpen(true), []);
  const hideHelp = useCallback(() => setIsOpen(false), []);

  const registerShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    setShortcuts((prev) => {
      // 合并快捷键，避免重复
      const existingKeys = new Set(prev.map((s) => `${s.key}-${s.ctrlKey}-${s.metaKey}`));
      const filtered = newShortcuts.filter(
        (s) => !existingKeys.has(`${s.key}-${s.ctrlKey}-${s.metaKey}`)
      );
      return [...prev, ...filtered];
    });
  }, []);

  // 按 Ctrl/Cmd + / 显示帮助
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        showHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  const value = useMemo(
    () => ({ showHelp, registerShortcuts }),
    [showHelp, registerShortcuts]
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={hideHelp}
        >
          <Card className="w-[500px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  键盘快捷键
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={hideHelp}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded-md">
                      {getShortcutDisplayText(shortcut)}
                    </kbd>
                  </div>
                ))}
                {shortcuts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">暂无快捷键</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
                按 <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + /</kbd> 显示或关闭此帮助
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}
