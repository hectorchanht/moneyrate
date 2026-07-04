"use client";

import CurrencyListModal from '@/components/CurrencyListModal';
import CurrencyRow from '@/components/CurrencyRow';
import InstallButton from '@/components/InstallButton';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import useWindowWidth from '@/hooks/useWindowWidth';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetchWithFallback, getCurrencyRateApiUrls } from '@/lib/api';
import {
  baseCurAtom,
  currency2DisplayAtom,
  currencyValueAtom,
  defaultCurrencyValueAtom,
  defaultCurrencyValueDpAtom,
  isDefaultCurrencyValueAtom,
  isEditingAtom,
  sortModeAtom,
  tourSeenAtom
} from '@/lib/atoms';
import { getDataFromLocalStorage, getDropIndex, resolveTourLocale, setDataToLocalStorage, showASCIIArt, sortCurrencyPairs } from '@/lib/fns';
import { ShareSvg } from '@/lib/svgs';
import { buildTourSteps, SUPPORTED_LOCALES, TOUR_INSTALL_FALLBACK_DESCRIPTION } from '@/lib/tourSteps';
import { CurrencyCode } from '@/lib/types';
import { driver, type Driver } from 'driver.js';
import { useAtom } from 'jotai';
import { pick } from 'lodash';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import useSWR from 'swr';

const LS_CURRENCIES = 'lastGood:currencies';
const rateCacheKey = (base: string) => `lastGood:rates:${base}`;
const VIRTUALIZE_THRESHOLD = 40; // rows; below this the natural flow (and drag-drop) is kept
const ROW_HEIGHT = 68; // px, used only in virtualized mode (fits value + 24h change line)

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
  const tourStartedRef = useRef(false);
  const tourDriverRef = useRef<Driver | null>(null);
  const windowWidth = useWindowWidth();
  const [baseCur, setBaseCur] = useAtom(baseCurAtom);
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [currencyValue, setCurrencyValue] = useAtom(currencyValueAtom);
  const [isEditing] = useAtom(isEditingAtom);
  const [isDefaultCurrencyValue] = useAtom(isDefaultCurrencyValueAtom);
  const [defaultCurrencyValue] = useAtom(defaultCurrencyValueAtom);
  const [defaultCurrencyValueDp] = useAtom(defaultCurrencyValueDpAtom);
  const [sortMode] = useAtom(sortModeAtom);
  const [tourSeen, setTourSeen] = useAtom(tourSeenAtom);

  // Optional historical date ('' = latest). Session-only; not persisted.
  const [historicalDate, setHistoricalDate] = useState('');
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Exchange rates update ~daily, so don't refetch both full tables on every window focus.
  const { data: data4BaseCur, error: err2 } = useSWR<CurrencyRate4BaseCur>(getCurrencyRateApiUrls({ baseCurrencyCode: baseCur, date: historicalDate || 'latest' }), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });
  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(getCurrencyRateApiUrls({}), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });

  // Yesterday's table for the same base, to compute a 24h change per currency.
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);
  // 24h change is only meaningful for the current rates, so skip this fetch in historical mode.
  const { data: dataYesterday } = useSWR<CurrencyRate4BaseCur>(historicalDate ? null : getCurrencyRateApiUrls({ baseCurrencyCode: baseCur, date: yesterdayStr }), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });

  // Only consult the localStorage cache after mount so the first client render matches the
  // server (which has no localStorage) — otherwise hydration mismatches.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Persist successful responses so a full API outage can fall back to the last-known-good data.
  useEffect(() => { if (data4All) setDataToLocalStorage(LS_CURRENCIES, data4All); }, [data4All]);
  // Don't let a historical view overwrite the last-known-good *latest* cache.
  useEffect(() => { if (data4BaseCur && !historicalDate) setDataToLocalStorage(rateCacheKey(baseCur), data4BaseCur); }, [data4BaseCur, baseCur, historicalDate]);

  // Hydrate state from a shared link (?base=&amount=&show=), overriding persisted prefs on load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const base = params.get('base');
    const amount = params.get('amount');
    const show = params.get('show');
    if (base) setBaseCur(base.toLowerCase() as CurrencyCode);
    if (amount !== null && amount !== '' && !isNaN(Number(amount))) setCurrencyValue(Number(amount));
    if (show) setCurrency2Display(show.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [shareCopied, setShareCopied] = useState(false);
  const onShare = useCallback(async () => {
    const params = new URLSearchParams({ base: baseCur, amount: String(currencyValue), show: currency2Display.join(',') });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      // clipboard unavailable (insecure context / denied) — the address bar is still updated
    }
  }, [baseCur, currencyValue, currency2Display]);

  const effectiveAll = useMemo<CurrencyRate4All | undefined>(
    () => data4All ?? (hydrated ? getDataFromLocalStorage(LS_CURRENCIES, undefined) : undefined),
    [data4All, hydrated]
  );

  // First-run guided tour: auto-starts once hydrated, real content is rendered
  // (not the skeleton), and the tour hasn't been seen yet. Guarded against
  // React Strict Mode's dev double-invoke by tourStartedRef.
  useEffect(() => {
    if (!hydrated || tourSeen || !effectiveAll || tourStartedRef.current) return;
    tourStartedRef.current = true;

    const locale = resolveTourLocale(typeof navigator !== 'undefined' ? navigator.languages : [], SUPPORTED_LOCALES, 'en');

    const steps = buildTourSteps(locale);

    // Pre-filter steps whose anchor selector isn't present in the DOM (silent
    // skip — driver.js throws at drive-time on an unresolvable selector).
    // Keep element-less steps (the welcome card) unconditionally.
    const filteredSteps = steps
      .filter((step) => !step.element || document.querySelector(step.element as string))
      .map((step) => {
        if (step.element !== '[data-tour="tour-install"]') return step;
        // Install anchor may be present with no button rendered (no captured
        // beforeinstallprompt). Swap in the fallback copy without mutating
        // the original step object; never drop step 8 (TOUR-06).
        const hasInstallButton = document.querySelector('[data-tour="tour-install"] button');
        if (hasInstallButton) return step;
        return { ...step, popover: { ...step.popover, description: TOUR_INSTALL_FALLBACK_DESCRIPTION } };
      });

    // One-time theme read for the overlay scrim only — do NOT re-init driver
    // on theme change; popover colors themselves come from tour.css tokens.
    const isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';

    const driverObj: Driver = driver({
      steps: filteredSteps,
      allowClose: true,
      overlayClickBehavior: 'close',
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      smoothScroll: true,
      stagePadding: 4,
      showProgress: true,
      overlayColor: isDarkTheme ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.45)',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: "Got it, let's go",
      onDoneClick: () => {
        setTourSeen(true);
        driverObj.destroy();
      },
      onCloseClick: () => {
        setTourSeen(true);
        driverObj.destroy();
      },
      onDestroyed: () => {
        setTourSeen(true);
      },
    });

    // Hold the instance in a ref so ONLY a real unmount tears it down (below).
    // Do NOT destroy in this effect's cleanup: effectiveAll changes identity when
    // the network fetch resolves after the cached value, which would re-run this
    // effect and destroy the tour milliseconds after it starts (→ onDestroyed
    // sets tourSeen, so it never reappears).
    tourDriverRef.current = driverObj;
    driverObj.drive();
  }, [hydrated, tourSeen, effectiveAll]);

  // Destroy the tour only on genuine unmount, never on dependency-change re-runs.
  useEffect(() => () => { tourDriverRef.current?.destroy(); tourDriverRef.current = null; }, []);

  const effectiveBaseCur = useMemo<CurrencyRate4BaseCur | undefined>(
    () => data4BaseCur ?? (hydrated ? getDataFromLocalStorage(rateCacheKey(baseCur), undefined) : undefined),
    [data4BaseCur, baseCur, hydrated]
  );
  const usingStale = Boolean((err1 || err2) && effectiveBaseCur);
  const ratesDate = typeof effectiveBaseCur?.date === 'string' ? effectiveBaseCur.date : undefined;

  const curObj: CurrencyRates = useMemo(() => {
    return pick(effectiveBaseCur?.[baseCur] as CurrencyRates, currency2Display);
  }, [effectiveBaseCur, baseCur, currency2Display]);

  // Percentage change vs yesterday's rate, per displayed currency.
  const changePctByCur = useMemo<Record<string, number>>(() => {
    const today = effectiveBaseCur?.[baseCur] as CurrencyRates | undefined;
    const yest = dataYesterday?.[baseCur] as CurrencyRates | undefined;
    if (!today || !yest) return {};
    const out: Record<string, number> = {};
    for (const code of currency2Display) {
      const t = today[code], y = yest[code];
      if (typeof t === 'number' && typeof y === 'number' && y !== 0) {
        out[code] = ((t - y) / y) * 100;
      }
    }
    return out;
  }, [effectiveBaseCur, dataYesterday, baseCur, currency2Display]);

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

  // Apply the chosen sort for the read-only view; editing always shows the custom (draggable) order.
  const rows = useMemo(
    () => sortCurrencyPairs(currencyRatesPairs2Display, isEditing ? 'custom' : sortMode, (c) => changePctByCur[c]),
    [currencyRatesPairs2Display, isEditing, sortMode, changePctByCur]
  );
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
      changePct={historicalDate ? undefined : changePctByCur[cur]}
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
            <button
              type="button"
              onClick={onShare}
              title="Copy shareable link"
              aria-label="Copy shareable link"
              data-tour="tour-share"
              className="h-[52px] w-[30px] shrink-0 flex items-center justify-center relative"
            >
              <ShareSvg />
              {shareCopied && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap opacity-70">Copied!</span>
              )}
            </button>
            <ThemeToggle />
            <SearchBar data={effectiveAll ?? {}} />
          </span>

          <br />

          <div className="text-center text-xs opacity-60 mb-2 flex flex-wrap items-center justify-center gap-2">
            <span>
              {usingStale ? 'Showing last saved rates' : 'Rates as of'}
              {ratesDate ? ` ${ratesDate}` : ''}
              {usingStale ? ' — live data unavailable' : ''}
            </span>
            <input
              type="date"
              max={todayStr}
              value={historicalDate}
              onChange={(e) => setHistoricalDate(e.target.value)}
              aria-label="View rates as of a past date"
              data-tour="tour-historical-date"
              className="bg-base-200 rounded px-1"
            />
            {historicalDate && (
              <button type="button" className="underline" onClick={() => setHistoricalDate('')}>today</button>
            )}
          </div>

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

      <footer className="m-auto w-full max-w-[800px] px-4 pb-4">
        <InstallButton />
      </footer>
    </div>
  )
}
