'use client';

import { languageAtom } from '@/lib/atoms';
import { LanguageContextType } from '@/lib/types';
import { useAtom } from 'jotai';
import { ReactNode, createContext, useContext, useEffect } from 'react';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useAtom(languageAtom);

  // Keep <html lang> in sync with the chosen language (screen readers use it
  // for pronunciation; it was hardcoded to "en" despite 30 locales).
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 