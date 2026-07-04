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
type TranslationDictionary = Omit<typeof translations.en, 'tour'> & { tour?: Partial<TourNamespace> };

export function useTranslation(): TranslationDictionary & { tour: TourNamespace } {
  const { language } = useLanguage();
  const dict = (translations[language as keyof typeof translations] || translations.en) as unknown as TranslationDictionary;
  // Per-key en fallback for `tour` (D-04) — mirrors getTourString's contract
  // so `i18n.tour.replayLabel` always resolves even for locales that haven't
  // authored the tour namespace yet.
  return { ...dict, tour: { ...translations.en.tour, ...dict.tour } };
}