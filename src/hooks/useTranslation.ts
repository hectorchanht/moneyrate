import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

// Not every locale object has a `tour` namespace yet (30-locale authoring is
// 03-02's job — this phase only lands `en`, the fallback source). Widening
// the return type here keeps `i18n.tour.*` call sites type-safe without
// requiring every locale to declare `tour` up front.
type TourNamespace = typeof translations.en.tour;
type TranslationDictionary = (typeof translations)[keyof typeof translations] & { tour?: Partial<TourNamespace> };

export function useTranslation(): TranslationDictionary & { tour: TourNamespace } {
  const { language } = useLanguage();
  const dict = (translations[language as keyof typeof translations] || translations.en) as TranslationDictionary;
  // Per-key en fallback for `tour` (D-04) — mirrors getTourString's contract
  // so `i18n.tour.replayLabel` always resolves even for locales that haven't
  // authored the tour namespace yet.
  return { ...dict, tour: { ...translations.en.tour, ...dict.tour } };
}