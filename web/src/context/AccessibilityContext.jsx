import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AccessibilityContext = createContext(null);

const STORAGE_KEY = 'a11y-prefs';

const defaultPrefs = { textScale: 'normal', highContrast: false, reduceMotion: false };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return defaultPrefs;
}

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  // Apply preferences to <html> so they affect the whole app
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('a11y-large', prefs.textScale === 'large');
    el.classList.toggle('a11y-xlarge', prefs.textScale === 'xlarge');
    el.classList.toggle('a11y-contrast', !!prefs.highContrast);
    el.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }, [prefs]);

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setPrefs(defaultPrefs), []);

  return (
    <AccessibilityContext.Provider value={{ prefs, update, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) return { prefs: defaultPrefs, update: () => {}, reset: () => {} };
  return ctx;
}
