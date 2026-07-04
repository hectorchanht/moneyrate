import { describe, expect, it } from 'vitest';
import { buildTourSteps, getTourString, SUPPORTED_LOCALES, TOUR_STEP_COUNT } from './tourSteps';
import { translations } from './translations';
import type { Language } from './types';

const EXPECTED_SELECTORS = [
  '[data-tour="tour-base-row"]',
  '[data-tour="tour-amount-input"]',
  '[data-tour="tour-search"]',
  '[data-tour="tour-list-settings"]',
  '[data-tour="tour-share"]',
  '[data-tour="tour-theme-toggle"]',
  '[data-tour="tour-historical-date"]',
  '[data-tour="tour-install"]',
];

describe('buildTourSteps', () => {
  const steps = buildTourSteps('en');

  it('returns the welcome step plus 8 anchored feature steps', () => {
    expect(steps.length).toBe(9);
  });

  it('the welcome step has no element (centered modal)', () => {
    expect(steps[0].element).toBeUndefined();
  });

  it('the 8 feature steps target the exact ordered selector list', () => {
    const selectors = steps.slice(1).map((s) => s.element);
    expect(selectors).toEqual(EXPECTED_SELECTORS);
  });

  it('every feature step progressText matches "n / 8", ending at 8 / 8', () => {
    const progressTexts = steps.slice(1).map((s) => s.popover?.progressText);
    for (const text of progressTexts) {
      expect(text).toMatch(/^[1-8] \/ 8$/);
    }
    expect(progressTexts[progressTexts.length - 1]).toBe('8 / 8');
  });

  it('the welcome step has no progress shown', () => {
    expect(steps[0].popover?.showProgress).toBe(false);
  });

  it('welcome and feature step copy is sourced from getTourString', () => {
    expect(steps[0].popover?.title).toBe(getTourString('en', 'welcomeTitle'));
    expect(steps[1].popover?.title).toBe(getTourString('en', 'step1Title'));
  });

  it('step 8 description defaults to the install-present copy (fallback swap happens in page.tsx)', () => {
    expect(steps[8].popover?.description).toBe(getTourString('en', 'step8Body'));
  });
});

describe('TOUR_STEP_COUNT', () => {
  it('is 8', () => {
    expect(TOUR_STEP_COUNT).toBe(8);
  });
});

describe('SUPPORTED_LOCALES', () => {
  it('has all 30 supported locales, drift-free from translations.ts', () => {
    expect(SUPPORTED_LOCALES.length).toBe(30);
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('zh-TW');
  });
});

describe('getTourString', () => {
  it('returns the English string for a known key', () => {
    expect(getTourString('en', 'welcomeTitle')).toBe('Welcome to moneyrate');
  });

  it('falls back to English when the whole locale is unsupported', () => {
    expect(getTourString('xx' as Language, 'welcomeTitle')).toBe(getTourString('en', 'welcomeTitle'));
  });

  it('provides a non-empty install-fallback and replay label', () => {
    expect(getTourString('en', 'step8FallbackBody').length).toBeGreaterThan(0);
    expect(getTourString('en', 'replayLabel').length).toBeGreaterThan(0);
  });

  it('the install-fallback fallback string mentions "install"', () => {
    expect(getTourString('en', 'step8FallbackBody')).toMatch(/install/i);
  });

  it('falls back to English for an unsupported locale on the install-fallback key too', () => {
    expect(getTourString('xx' as Language, 'step8FallbackBody')).toBe(getTourString('en', 'step8FallbackBody'));
  });
});

describe('tour namespace coverage', () => {
  // Canonical 19-key set (D-04/UI-SPEC Copywriting Contract) — every locale's
  // `tour` namespace must match this exactly, no missing/extra key.
  const TOUR_KEYS = Object.keys(translations.en.tour).sort();

  // CJK locales get a tighter body budget (55 glyphs vs 110 Latin chars) since
  // each glyph renders roughly 2x the visual width of a Latin character.
  const CJK_LOCALES = new Set<Language>(['zh-TW', 'zh-CN', 'ja', 'ko']);

  const TITLE_KEYS = [
    'welcomeTitle',
    'step1Title',
    'step2Title',
    'step3Title',
    'step4Title',
    'step5Title',
    'step6Title',
    'step7Title',
    'step8Title',
  ] as const;

  const BODY_KEYS = [
    'welcomeBody',
    'step1Body',
    'step2Body',
    'step3Body',
    'step4Body',
    'step5Body',
    'step6Body',
    'step7Body',
    'step8Body',
    'step8FallbackBody',
  ] as const;

  const BUTTON_KEYS = ['nextBtn', 'prevBtn', 'doneBtn'] as const;

  // Detects common emoji/pictograph code points by inspecting each string's
  // Unicode code points directly (via Array.from + codePointAt), rather than
  // a regex with the `u` flag or \p{} property escapes — this repo's
  // tsconfig.json has no explicit `target`, and plain `tsc --noEmit` then
  // defaults to a target too old for both features. These ranges cover the
  // emoji actually used elsewhere in translations.ts (home/settings), so
  // this is a reliable "did tour pick up emoji" check.
  const containsEmoji = (value: string): boolean =>
    Array.from(value).some((char) => {
      const cp = char.codePointAt(0) ?? 0;
      return (
        (cp >= 0x1f300 && cp <= 0x1faff) || // misc symbols/pictographs, emoticons, transport, supplemental symbols
        (cp >= 0x2600 && cp <= 0x27bf) || // misc symbols + dingbats (e.g. 🔧🔄💰🌐 fall outside this but this covers ☀-➿ range)
        (cp >= 0x1f1e6 && cp <= 0x1f1ff) // regional indicators (flag emoji)
      );
    });

  it('every SUPPORTED_LOCALE has translations[locale].tour defined', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour?: Record<string, string> };
      expect(dict.tour, `translations['${locale}'].tour should be defined`).toBeDefined();
    }
  });

  it('every SUPPORTED_LOCALE tour namespace has exactly the same 19 keys as en.tour', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour: Record<string, string> };
      const localeKeys = Object.keys(dict.tour).sort();
      expect(localeKeys, `translations['${locale}'].tour key set should match en.tour`).toEqual(TOUR_KEYS);
    }
  });

  it('every title fits the <=40 character/glyph budget', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour: Record<string, string> };
      for (const key of TITLE_KEYS) {
        const value = dict.tour[key];
        expect(
          value.length,
          `translations['${locale}'].tour.${key} ("${value}") exceeds 40 chars/glyphs`
        ).toBeLessThanOrEqual(40);
      }
    }
  });

  it('every body fits the Latin (<=110) or CJK (<=55) character/glyph budget', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour: Record<string, string> };
      const limit = CJK_LOCALES.has(locale) ? 55 : 110;
      for (const key of BODY_KEYS) {
        const value = dict.tour[key];
        expect(
          value.length,
          `translations['${locale}'].tour.${key} ("${value}") exceeds ${limit} chars/glyphs`
        ).toBeLessThanOrEqual(limit);
      }
    }
  });

  it('every button label (next/prev/done) fits the <=12 character budget in any locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour: Record<string, string> };
      for (const key of BUTTON_KEYS) {
        const value = dict.tour[key];
        expect(
          value.length,
          `translations['${locale}'].tour.${key} ("${value}") exceeds 12 chars`
        ).toBeLessThanOrEqual(12);
      }
    }
  });

  it('no tour.* value contains an emoji in any locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = translations[locale as keyof typeof translations] as { tour: Record<string, string> };
      for (const key of TOUR_KEYS) {
        const value = dict.tour[key];
        expect(
          containsEmoji(value),
          `translations['${locale}'].tour.${key} ("${value}") should not contain an emoji`
        ).toBe(false);
      }
    }
  });
});
