import { useEffect } from "react";

export function useKeyboardShortcut(key: string, onTrigger: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.shiftKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, onTrigger]);
}
