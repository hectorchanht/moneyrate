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