'use client';

import { languageAtom } from '@/lib/atoms';
import { LanguageContextType } from '@/lib/types';
import { useAtom } from 'jotai';
import { ReactNode, createContext, useContext } from 'react';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useAtom(languageAtom);

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