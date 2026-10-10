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

// Push-alert kind: 'target' fires when the rate hits a level; 'pct' fires on
// a 24h % move. Stored alerts created before this field existed have no kind
// and are treated as 'target'. Email alerts stay target-only (the server cron
// has no 24h-ago rates to compare against).
export type AlertKind = 'target' | 'pct';

export interface RateAlert {
  id: string;
  from: string;
  to: string;
  target: number;          // target rate (kind=target) | % threshold (kind=pct)
  direction: AlertDirection; // target: above/below the rate; pct: above=rises ≥%, below=falls ≥%
  kind: AlertKind;
  triggered: boolean;
  createdAt: number;
}

export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

export type LanguageCode = string & { readonly __brand: 'LanguageCode' };