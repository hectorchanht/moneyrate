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
type ToolsNamespace = { [K in keyof typeof translations.en.tools]: string };
type HomeNamespace = { [K in keyof typeof translations.en.home]: string };
type TranslationDictionary = Omit<typeof translations.en, 'tour' | 'settings' | 'tools' | 'home'> & {
  tour?: Partial<TourNamespace>;
  settings?: Partial<SettingsNamespace>;
  tools?: Partial<ToolsNamespace>;
  home?: Partial<HomeNamespace>;
};

export function useTranslation(): TranslationDictionary & { tour: TourNamespace; settings: SettingsNamespace; tools: ToolsNamespace; home: HomeNamespace } {
  const { language } = useLanguage();
  const dict = (translations[language as keyof typeof translations] || translations.en) as unknown as TranslationDictionary;
  // Per-key en fallback for `tour` (D-04) — mirrors getTourString's contract
  // so `i18n.tour.replayLabel` always resolves even for locales that haven't
  // authored the tour namespace yet.
  // Same treatment for `settings`: new settings keys only need authoring in
  // en (+ the locales we actually translate); every other locale falls back
  // to the English string per key instead of rendering a blank label.
  // Same for `tools` (the /trip, /compare, /batch pages): en + zh-TW + zh-CN
  // authored, everyone else gets English per key.
  // Same for `home`: the whyFree manifesto line is authored in en + zh-TW
  // only (no Simplified form), so every other locale falls back to English.
  return {
    ...dict,
    tour: { ...translations.en.tour, ...dict.tour },
    settings: { ...translations.en.settings, ...dict.settings },
    tools: { ...translations.en.tools, ...dict.tools },
    home: { ...translations.en.home, ...dict.home },
  };
}
