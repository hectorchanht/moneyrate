export type SearchItem = {
  id: string;
  name: string;
};

export type CurrencyRates = {
  [key: string]: number;
};

export type Language =
  | 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'it' | 'pt'
  | 'ru' | 'ar' | 'hi' | 'bn' | 'pa' | 'ur' | 'vi' | 'th' | 'id' | 'ms'
  | 'nl' | 'sv' | 'no' | 'da' | 'fi' | 'pl' | 'ro' | 'sk' | 'sl' | 'tr';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export type SortMode = 'custom' | 'name' | 'value' | 'change';

export type Theme = 'light' | 'dark';

// User's theme preference — 'system' follows the OS via matchMedia.
// ThemeApplier resolves it to a concrete Theme for <html data-theme>.
export type ThemeMode = 'dark' | 'light' | 'system';

export type CopyFormat = 'value' | 'full';

export type AlertDirection = 'above' | 'below';

export interface RateAlert {
  id: string;
  from: string;
  to: string;
  target: number;
  direction: AlertDirection;
  triggered: boolean;
  createdAt: number;
}

export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

export type LanguageCode = string & { readonly __brand: 'LanguageCode' };