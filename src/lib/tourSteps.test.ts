import { describe, expect, it } from 'vitest';
import { buildTourSteps, SUPPORTED_LOCALES, TOUR_INSTALL_FALLBACK_DESCRIPTION, TOUR_STEP_COUNT } from './tourSteps';

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

describe('TOUR_INSTALL_FALLBACK_DESCRIPTION', () => {
  it('is a non-empty fallback string for the install step', () => {
    expect(TOUR_INSTALL_FALLBACK_DESCRIPTION.length).toBeGreaterThan(0);
  });
});
