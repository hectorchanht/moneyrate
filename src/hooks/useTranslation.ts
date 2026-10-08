import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

// All 30 locales now author a `tour` namespace (03-02), but each locale's
// `as const` literal string types differ from `en`'s, so a return type pinned
// to `typeof translations.en.tour` (all-literal) would reject every other
// locale's dict at the structural-assignability check. Widen only `tour`'s
// value types to `string` here (call sites only need string access, never
// the literal) while leaving `home`/`settings` typed exactly as `en`'s shape
// (their values are locale-invariant in structure, only literals differ,
// which is fine since nothing narrows on those literals).
type TourNamespace = { [K in keyof typeof translations.en.tour]: string };
type SettingsNamespace = { [K in keyof typeof translations.en.settings]: string };
type TranslationDictionary = Omit<typeof translations.en, 'tour' | 'settings'> & {
  tour?: Partial<TourNamespace>;
  settings?: Partial<SettingsNamespace>;
};

export function useTranslation(): TranslationDictionary & { tour: TourNamespace; settings: SettingsNamespace } {
  const { language } = useLanguage();
  const dict = (translations[language as keyof typeof translations] || translations.en) as unknown as TranslationDictionary;
  // Per-key en fallback for `tour` (D-04) — mirrors getTourString's contract
  // so `i18n.tour.replayLabel` always resolves even for locales that haven't
  // authored the tour namespace yet.
  // Same treatment for `settings`: new settings keys only need authoring in
  // en (+ the locales we actually translate); every other locale falls back
  // to the English string per key instead of rendering a blank label.
  return {
    ...dict,
    tour: { ...translations.en.tour, ...dict.tour },
    settings: { ...translations.en.settings, ...dict.settings },
  };
}
