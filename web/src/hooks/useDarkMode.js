import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Manages dark mode with localStorage persistence and system preference detection.
 * Usage: const [isDark, toggleDark] = useDarkMode();
 */
export function useDarkMode() {
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [isDark, setIsDark] = useLocalStorage('darkMode', prefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  return [isDark, toggleDark, setIsDark];
}
