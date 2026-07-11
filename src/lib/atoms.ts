import { atomWithStorage } from 'jotai/utils';
import { DefaultBaseCur, DefaultCurrency2Display, DefaultCurrencyValue } from './constants';
import type { CurrencyCode, Language, SortMode, Theme } from './types';

// Create atoms with localStorage persistence
export const baseCurAtom = atomWithStorage<CurrencyCode>('baseCur', DefaultBaseCur as CurrencyCode);
export const currency2DisplayAtom = atomWithStorage<string[]>('currency2Display', DefaultCurrency2Display);
export const currencyValueAtom = atomWithStorage<number>('currencyValue', DefaultCurrencyValue);
export const isEditingAtom = atomWithStorage<boolean>('isEditing', false);
export const isDefaultCurrencyValueAtom = atomWithStorage<boolean>('isDefaultCurrencyValue', true);
export const defaultCurrencyValueAtom = atomWithStorage<number>('defaultCurrencyValue', DefaultCurrencyValue);
export const defaultCurrencyValueDpAtom = atomWithStorage<number>('defaultCurrencyValueDp', 2);
export const languageAtom = atomWithStorage<Language>('language', 'en');
export const sortModeAtom = atomWithStorage<SortMode>('sortMode', 'custom');
export const themeAtom = atomWithStorage<Theme>('theme', 'dark');
export const tourSeenAtom = atomWithStorage<boolean>('tourSeen', false);
export const showDatePickerAtom = atomWithStorage<boolean>('showDatePicker', false);

// Single source of truth for every persisted localStorage key above.
// MUST stay in sync (same keys, same declaration order) with the atomWithStorage
// calls above — the drift-guard test in atoms.test.ts fails if they diverge.
// Consumed by the settings Reset handler so no persisted key (e.g. tourSeen,
// showDatePicker) is ever left behind.
export const PERSISTED_ATOM_KEYS = ['baseCur', 'currency2Display', 'currencyValue', 'isEditing', 'isDefaultCurrencyValue', 'defaultCurrencyValue', 'defaultCurrencyValueDp', 'language', 'sortMode', 'theme', 'tourSeen', 'showDatePicker'] as const;
