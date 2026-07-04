import { describe, expect, it } from 'vitest';
import { buildTourSteps, getTourString, SUPPORTED_LOCALES, TOUR_STEP_COUNT } from './tourSteps';
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
