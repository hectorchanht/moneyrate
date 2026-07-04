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
export const TOUR_INSTALL_FALLBACK_DESCRIPTION =
  "Look for an install option in your browser's menu — moneyrate works offline once installed.";

// Copy for the final anchored step's CTA (step 8/8), replacing "Next".
export const TOUR_DONE_BTN_TEXT = "Got it, let's go";

type TourFeatureStepCopy = {
  selector: string;
  title: string;
  description: string;
};

// 8-step copy, in TOUR-06 anchor order. English only in Phase 1 (D-05 scope
// note — full 30-language dictionary entries are Phase 3's job, I18N-01).
// `locale` is accepted by buildTourSteps() and threaded for Phase 3 to
// localize; Phase 1 returns this English copy regardless of locale.
const TOUR_FEATURE_STEPS: TourFeatureStepCopy[] = [
  {
    selector: '[data-tour="tour-base-row"]',
    title: 'Set your base currency',
    description: 'Tap any currency row to make it the base — every other rate recalculates instantly.',
  },
  {
    selector: '[data-tour="tour-amount-input"]',
    title: 'Edit the amount',
    description: 'Type a number (or a quick sum like 5+3) into the base row to convert a custom amount.',
  },
  {
    selector: '[data-tour="tour-search"]',
    title: 'Add a currency',
    description: 'Search any fiat, crypto, or commodity by name or code to add it to your list.',
  },
  {
    selector: '[data-tour="tour-list-settings"]',
    title: 'Manage your list',
    description: 'Open this menu to add or remove currencies in bulk, reorder them, or change settings.',
  },
  {
    selector: '[data-tour="tour-share"]',
    title: 'Share your rates',
    description: 'Copy a link that reopens this exact base, amount, and currency list for anyone.',
  },
  {
    selector: '[data-tour="tour-theme-toggle"]',
    title: 'Switch theme',
    description: 'Toggle between light and dark mode any time.',
  },
  {
    selector: '[data-tour="tour-historical-date"]',
    title: 'Look up past rates',
    description: 'Pick a date to see what the rates were on any day in history.',
  },
  {
    selector: '[data-tour="tour-install"]',
    title: 'Install the app',
    description: 'Add moneyrate to your home screen or desktop for one-tap access, even offline.',
  },
];

// Builds the full driver.js step list: a centered welcome card (no `element`,
// per D-04) followed by the 8 anchored feature steps in UI-SPEC order, each
// carrying an explicit `progressText` of the form "{index} / 8" so the
// welcome step's presence in the array doesn't skew the built-in
// {{current}}/{{total}} progress count (RESEARCH Pitfall 2).
export const buildTourSteps = (locale: Language): DriveStep[] => {
  // Phase 1 ships English copy only; `locale` is threaded through for Phase 3.
  void locale;

  const welcomeStep: DriveStep = {
    popover: {
      title: 'Welcome to moneyrate',
      description: 'A quick ~30-second tour of the essentials?',
      showButtons: ['next', 'close'],
      showProgress: false,
    },
  };

  const featureSteps: DriveStep[] = TOUR_FEATURE_STEPS.map((step, i) => ({
    element: step.selector,
    popover: {
      title: step.title,
      description: step.description,
      progressText: `${i + 1} / ${TOUR_STEP_COUNT}`,
    },
  }));

  return [welcomeStep, ...featureSteps];
};
