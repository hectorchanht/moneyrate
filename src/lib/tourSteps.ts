import type { DriveStep } from 'driver.js';
import { translations } from './translations';
import type { Language } from './types';

// Number of anchored feature steps in the tour, excluding the welcome card.
// TOUR-06 requires exactly 8 guided steps.
export const TOUR_STEP_COUNT = 8;

// Derived from translations.ts (the source of truth for the 30 supported
// locales) rather than hand-duplicated, to avoid drift.
export const SUPPORTED_LOCALES = Object.keys(translations) as Language[];

// Fallback copy for step 8 when the InstallButton has no captured
// `beforeinstallprompt` event (desktop Safari/Firefox, already-installed PWAs).
// Still imported by page.tsx until Task 2 migrates that call site to
// getTourString(language, 'step8FallbackBody') and deletes this export.
export const TOUR_INSTALL_FALLBACK_DESCRIPTION = translations.en.tour.step8FallbackBody;

type TourNamespace = typeof translations.en.tour;

// Not every locale object has a `tour` namespace yet (30-locale authoring is
// 03-02's job — this phase only lands `en`, the fallback source). Indexing
// through this widened view keeps getTourString type-safe without requiring
// every locale to declare `tour` up front.
type TranslationsWithOptionalTour = {
  [K in keyof typeof translations]: (typeof translations)[K] & { tour?: Partial<TourNamespace> };
};
const translationsWithOptionalTour = translations as TranslationsWithOptionalTour;

// Per-string i18n fallback (D-04): looks up ONE key in the active locale's
// `tour` namespace, falling back to `en` only for that specific key — never
// the whole-object fallback useTranslation() uses (that would silently drop
// every other correctly-translated tour string when just one key is missing
// from a locale). See RESEARCH.md Pitfall 2.
export const getTourString = (locale: Language, key: keyof TourNamespace): string => {
  const localeTour = translationsWithOptionalTour[locale]?.tour;
  return localeTour?.[key] ?? translations.en.tour[key];
};

type TourFeatureStepCopy = {
  selector: string;
};

// 8-step anchor order (TOUR-06). Copy itself is localized via getTourString
// in buildTourSteps() below; only the selector (never localized, per
// CLAUDE.md's data-tour anchor rule) lives here.
const TOUR_FEATURE_STEPS: TourFeatureStepCopy[] = [
  { selector: '[data-tour="tour-base-row"]' },
  { selector: '[data-tour="tour-amount-input"]' },
  { selector: '[data-tour="tour-search"]' },
  { selector: '[data-tour="tour-list-settings"]' },
  { selector: '[data-tour="tour-share"]' },
  { selector: '[data-tour="tour-theme-toggle"]' },
  { selector: '[data-tour="tour-historical-date"]' },
  { selector: '[data-tour="tour-install"]' },
];

// Builds the full driver.js step list: a centered welcome card (no `element`,
// per D-04) followed by the 8 anchored feature steps in UI-SPEC order, each
// carrying an explicit `progressText` of the form "{index} / 8" so the
// welcome step's presence in the array doesn't skew the built-in
// {{current}}/{{total}} progress count (RESEARCH Pitfall 2).
export const buildTourSteps = (locale: Language): DriveStep[] => {
  const welcomeStep: DriveStep = {
    popover: {
      title: getTourString(locale, 'welcomeTitle'),
      description: getTourString(locale, 'welcomeBody'),
      showButtons: ['next', 'close'],
      // driver.js 1.6.0 ignores per-step `showProgress: false` when the driver
      // is globally configured with showProgress: true, so it falls back to the
      // default "1 of N" counter on the welcome card. An empty progressText
      // renders nothing, keeping the welcome free of a step counter (the "8
      // steps" of TOUR-06 are the anchored feature steps only).
      showProgress: false,
      progressText: ' ',
    },
  };

  const featureSteps: DriveStep[] = TOUR_FEATURE_STEPS.map((step, i) => ({
    element: step.selector,
    popover: {
      title: getTourString(locale, `step${i + 1}Title` as keyof TourNamespace),
      description: getTourString(locale, `step${i + 1}Body` as keyof TourNamespace),
      progressText: `${i + 1} / ${TOUR_STEP_COUNT}`,
    },
  }));

  return [welcomeStep, ...featureSteps];
};
