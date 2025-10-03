import { atomWithStorage } from 'jotai/utils';
import { DefaultBaseCur, DefaultCurrency2Display, DefaultCurrencyValue } from './constants';
import type { CurrencyCode, Language } from './types';

// Create atoms with localStorage persistence
export const baseCurAtom = atomWithStorage<CurrencyCode>('baseCur', DefaultBaseCur as CurrencyCode);
export const currency2DisplayAtom = atomWithStorage<string[]>('currency2Display', DefaultCurrency2Display);
export const currencyValueAtom = atomWithStorage<number>('currencyValue', DefaultCurrencyValue);
export const isEditingAtom = atomWithStorage<boolean>('isEditing', false);
export const isDefaultCurrencyValueAtom = atomWithStorage<boolean>('isDefaultCurrencyValue', true);
export const defaultCurrencyValueAtom = atomWithStorage<number>('defaultCurrencyValue', DefaultCurrencyValue);
export const defaultCurrencyValueDpAtom = atomWithStorage<number>('defaultCurrencyValueDp', 0);
export const languageAtom = atomWithStorage<Language>('language', 'en'); 