"use client";

import CurrencyListModal from '@/components/CurrencyListModal';
import CurrencyRow from '@/components/CurrencyRow';
import SearchBar from '@/components/SearchBar';
import useWindowWidth from '@/hooks/useWindowWidth';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetchWithFallback, getCurrencyRateApiUrls } from '@/lib/api';
import {
  baseCurAtom,
  currency2DisplayAtom,
  currencyValueAtom,
  defaultCurrencyValueAtom,
  defaultCurrencyValueDpAtom,
  isDefaultCurrencyValueAtom,
  isEditingAtom
} from '@/lib/atoms';
import { getDataFromLocalStorage, getDropIndex, setDataToLocalStorage, showASCIIArt } from '@/lib/fns';
import { CurrencyCode } from '@/lib/types';
import { useAtom } from 'jotai';
import { pick } from 'lodash';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import useSWR from 'swr';

const LS_CURRENCIES = 'lastGood:currencies';
const rateCacheKey = (base: string) => `lastGood:rates:${base}`;
const VIRTUALIZE_THRESHOLD = 40; // rows; below this the natural flow (and drag-drop) is kept
const ROW_HEIGHT = 58; // px, used only in virtualized mode

declare global {
  interface DragDropTouch {
    enable: () => void;
    // Add other methods or properties if needed
  }

  interface Window {
    DragDropTouch?: DragDropTouch;
    enableDragDropTouch?: () => void;
  }
}

const useDragDropTouch = () => {
  useEffect(() => {
    const script = document.createElement('script');
    // Vendored from drag-drop-touch-js.github.io into /public so it loads same-origin
    // (removes the unpinned third-party script / missing-SRI risk).
    script.src = '/vendor/drag-drop-touch.esm.min.js?autoload';
    script.type = 'module';
    script.onload = () => {
      if (typeof window.enableDragDropTouch === 'function') {
        window.enableDragDropTouch(); // Initialize the polyfill
        console.log('drag-drop-touch initialized via custom hook.');
      } else {
        console.error('enableDragDropTouch is not available on window.');
      }

      window.DragDropTouch?.enable();
    };
    script.onerror = () => {
      console.error('Failed to load drag-drop-touch script.');
    };
    document.body.appendChild(script);

    showASCIIArt();

    return () => {
      document.body.removeChild(script);
    };
  }, []);
};

type CurrencyRates = {
  [key: string]: number;
};

export default function Home() {
  useDragDropTouch();

  const currencyItemOnDrag = useRef<string>('');
  const windowWidth = useWindowWidth();
  const [baseCur, setBaseCur] = useAtom(baseCurAtom);
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [currencyValue, setCurrencyValue] = useAtom(currencyValueAtom);
  const [isEditing] = useAtom(isEditingAtom);
  const [isDefaultCurrencyValue] = useAtom(isDefaultCurrencyValueAtom);
  const [defaultCurrencyValue] = useAtom(defaultCurrencyValueAtom);
  const [defaultCurrencyValueDp] = useAtom(defaultCurrencyValueDpAtom);

  // Exchange rates update ~daily, so don't refetch both full tables on every window focus.
  const { data: data4BaseCur, error: err2 } = useSWR<CurrencyRate4BaseCur>(getCurrencyRateApiUrls({ baseCurrencyCode: baseCur }), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });
  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(getCurrencyRateApiUrls({}), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });

  // Only consult the localStorage cache after mount so the first client render matches the
  // server (which has no localStorage) — otherwise hydration mismatches.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Persist successful responses so a full API outage can fall back to the last-known-good data.
  useEffect(() => { if (data4All) setDataToLocalStorage(LS_CURRENCIES, data4All); }, [data4All]);
  useEffect(() => { if (data4BaseCur) setDataToLocalStorage(rateCacheKey(baseCur), data4BaseCur); }, [data4BaseCur, baseCur]);

  const effectiveAll = useMemo<CurrencyRate4All | undefined>(
    () => data4All ?? (hydrated ? getDataFromLocalStorage(LS_CURRENCIES, undefined) : undefined),
    [data4All, hydrated]
  );
  const effectiveBaseCur = useMemo<CurrencyRate4BaseCur | undefined>(
    () => data4BaseCur ?? (hydrated ? getDataFromLocalStorage(rateCacheKey(baseCur), undefined) : undefined),
    [data4BaseCur, baseCur, hydrated]
  );
  const usingStale = Boolean((err1 || err2) && effectiveBaseCur);

  const curObj: CurrencyRates = useMemo(() => {
    return pick(effectiveBaseCur?.[baseCur] as CurrencyRates, currency2Display);
  }, [effectiveBaseCur, baseCur, currency2Display]);

  const currencyRatesPairs2Display: [string, number][] = useMemo(() => {
    return Object.entries(curObj) || [];;
  }, [curObj]);

  const removeCurrency2Display = useCallback((name: string) => {
    setCurrency2Display(prev => prev.filter(c => c !== name));
  }, [setCurrency2Display]);

  const onBaseCurChange = useCallback((cur: string) => {
    if (isDefaultCurrencyValue) {
      setCurrencyValue(defaultCurrencyValue || 100);
    } else {
      const dataAfter = Object.entries(curObj).reduce<CurrencyRates>((acc, [code, val]) => {
        if (code === baseCur) {
          acc[code] = val;
        } else {
          acc[code] = val * currencyValue;
        }
        return acc;
      }, {});
      setCurrencyValue(dataAfter[cur] || 100);
    }
    setBaseCur(cur as CurrencyCode);
  }, [isDefaultCurrencyValue, defaultCurrencyValue, curObj, baseCur, currencyValue, setCurrencyValue, setBaseCur]);

  // Stable ref setter so memoized rows don't re-render on every parent render.
  const onDragStart = useCallback((cur: string) => { currencyItemOnDrag.current = cur; }, []);

  // Handle currency value changes
  const handleCurrencyValueChange = useCallback((value: number) => {
    setCurrencyValue(value);
  }, [setCurrencyValue]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isEditing) return;
    const dropZone = e.currentTarget; // The drop zone element
    const dropZoneRect = dropZone.getBoundingClientRect(); // Get the bounding rectangle of the drop zone

    // Get the mouse coordinates relative to the drop zone
    const dropY = e.clientY - dropZoneRect.top;

    const itemHeight = 72; // Assuming each currency item has a fixed height

    const newCurrency2Display = [...currency2Display];
    const draggedIndex = newCurrency2Display.indexOf(currencyItemOnDrag.current);
    if (draggedIndex === -1) return; // dragged item no longer in list

    const itemIndex = getDropIndex(dropY, itemHeight, newCurrency2Display.length);

    const [movedItem] = newCurrency2Display.splice(draggedIndex, 1);
    newCurrency2Display.splice(itemIndex, 0, movedItem);
    setCurrency2Display(newCurrency2Display);
  };

  const rows = currencyRatesPairs2Display;
  // Drag-drop needs natural flow, so only virtualize large, read-only (non-editing) lists.
  const shouldVirtualize = !isEditing && rows.length > VIRTUALIZE_THRESHOLD;

  const renderRow = (cur: string, val: number, index: number, style?: CSSProperties) => (
    <CurrencyRow
      key={cur}
      cur={cur}
      val={val}
      currencyValue={currencyValue}
      baseCur={baseCur}
      isEditing={isEditing}
      windowWidth={windowWidth}
      defaultCurrencyValueDp={defaultCurrencyValueDp}
      name={effectiveAll?.[cur]}
      showDivider={index < rows.length - 1}
      style={style}
      onDragStart={onDragStart}
      onSelectBase={onBaseCurChange}
      onRemove={removeCurrency2Display}
      onValueChange={handleCurrencyValueChange}
    />
  );

  if ((err1 || err2) && !effectiveBaseCur) return <div className="text-center">Error fetching data. Please try again later.</div>;
  if (isLoad1 && !effectiveAll) return <div className="h-full p-4 grid grid-cols-1 justify-between m-auto max-w-[800px]">
    <div className="skeleton h-[51px] w-full rounded-none"></div>
    <br />
    {Array.from({ length: 12 }, (_, index) => <div className="flex flex-col" key={index}>
      <div className='flex items-center justify-between w-full ' >
        <div className='flex items-center justify-center gap-2'>
          <div className="skeleton h-[42px] w-[42px] shrink-0 rounded-none" />
          <div className="skeleton h-[42px] w-[94px] rounded-none"></div>
        </div>

        <div className="skeleton h-[42px] w-[200px] rounded-none"></div>
      </div>
      {index < 11 ? <div className="divider my-2" /> : <br />}
    </div>)}
  </div>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        <div className='grid grid-cols-1 justify-between m-auto max-w-[800px] p-4'>
          <span className='flex gap-2 w-full items-start'>
            <CurrencyListModal data={effectiveAll ?? {}} />
            <SearchBar data={effectiveAll ?? {}} />
          </span>

          <br />

          {usingStale && (
            <div className="text-center text-xs opacity-60 mb-2">
              Showing last saved rates — live data unavailable.
            </div>
          )}

          {shouldVirtualize ? (
            <FixedSizeList
              height={Math.min(rows.length * ROW_HEIGHT, 640)}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              width="100%"
            >
              {({ index, style }) => {
                const [cur, val] = rows[index];
                return renderRow(cur, val, index, style);
              }}
            </FixedSizeList>
          ) : (
            <div
              id='currencyList'
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative"
            >
              {rows.map(([cur, val], i) => renderRow(cur, val, i))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
