"use client";

import CurrencyListModal, { languageOptions } from '@/components/CurrencyListModal';
import AffiliateLinks from '@/components/AffiliateLinks';
import CurrencyRow from '@/components/CurrencyRow';
import InstallButton from '@/components/InstallButton';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import useWindowWidth from '@/hooks/useWindowWidth';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetchWithFallback, getCurrencyRateApiUrls } from '@/lib/api';
import {
  baseCurAtom,
  compactRowsAtom,
  copyFormatAtom,
  currency2DisplayAtom,
  currencyValueAtom,
  defaultCurrencyValueAtom,
  defaultCurrencyValueDpAtom,
  hapticsAtom,
  isDefaultCurrencyValueAtom,
  isEditingAtom,
  languageAtom,
  pinnedCurrenciesAtom,
  rateAlertsAtom,
  showChangePctAtom,
  showPinButtonsAtom,
  showDatePickerAtom,
  sortModeAtom,
  tourSeenAtom
} from '@/lib/atoms';
import { getDataFromLocalStorage, getDropIndex, resolveTourLocale, setDataToLocalStorage, showASCIIArt, sortCurrencyPairs, vibrate } from '@/lib/fns';
import { CurrencyNameOverrides } from '@/lib/constants';
import { BellSvg, GlobeSvg, ImageSvg, QuestionSvg, ShareSvg, CalendarSvg } from '@/lib/svgs';
import { buildTourSteps, getTourString, SUPPORTED_LOCALES } from '@/lib/tourSteps';
import { shareRateCard } from '@/lib/shareCard';
import { CurrencyCode, Language, RateAlert } from '@/lib/types';
import type { Driver } from 'driver.js';
import { useAtom } from 'jotai';
import { pick } from 'lodash';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import useSWR from 'swr';

const LS_CURRENCIES = 'lastGood:currencies';
const rateCacheKey = (base: string) => `lastGood:rates:${base}`;
const VIRTUALIZE_THRESHOLD = 40; // rows; below this the natural flow (and drag-drop) is kept
const ROW_HEIGHT = 68; // px, used only in virtualized mode (fits value + 24h change line)
// RTL Contract: only ar/ur among the 30 supported locales use a right-to-left
// script (confirmed via translations.ts). Scoped to the tour popover only —
// never drives an app-wide dir change.
const RTL_LOCALES = new Set<Language>(['ar', 'ur']);

const useDragDropTouch = () => {
  useEffect(() => {
    const script = document.createElement('script');
    // Vendored from drag-drop-touch-js.github.io into /public so it loads same-origin
    // (removes the unpinned third-party script / missing-SRI risk).
    script.src = '/vendor/drag-drop-touch.esm.min.js?autoload';
    script.type = 'module';
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
  const [showDatePicker, setShowDatePicker] = useAtom(showDatePickerAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  // Display prefs + features (settings tab, 2026-10-08 batch)
  const [showChangePct] = useAtom(showChangePctAtom);
  const [compactRows] = useAtom(compactRowsAtom);
  const [copyFormat] = useAtom(copyFormatAtom);
  const [haptics] = useAtom(hapticsAtom);
  const [showPinButtons] = useAtom(showPinButtonsAtom);
  const [pinnedCurrencies, setPinnedCurrencies] = useAtom(pinnedCurrenciesAtom);
  const [rateAlerts, setRateAlerts] = useAtom(rateAlertsAtom);
  const i18n = useTranslation();

  // Optional historical date ('' = latest). Session-only; not persisted.
  const [historicalDate, setHistoricalDate] = useState('');
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Exchange rates update ~daily, so don't refetch both full tables on every window focus.
  const { data: data4BaseCur, error: err2, isLoading: isLoad2 } = useSWR<CurrencyRate4BaseCur>(getCurrencyRateApiUrls({ baseCurrencyCode: baseCur, date: historicalDate || 'latest' }), fetchWithFallback, { keepPreviousData: true, revalidateOnFocus: false });
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

  // LANG-01/D-03: on first load only (no stored 'language' key yet), default
  // languageAtom to the device locale so the app UI *and* the tour render in
  // the visitor's device language. A stored user choice always wins
  // thereafter — this must never fire again once a value has been written.
  // Gated behind `hydrated` (never at module-eval time in atoms.ts) to avoid
  // an SSR/CSR hydration mismatch, same pattern as the link-hydration effect
  // above. Placed above the tour auto-start effect so the very first tour
  // render already reflects the device-derived language.
  useEffect(() => {
    if (!hydrated) return;
    if (getDataFromLocalStorage('language', null) === null) {
      setLanguage(resolveTourLocale(typeof navigator !== 'undefined' ? navigator.languages : [], SUPPORTED_LOCALES, 'en'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const [shareCopied, setShareCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [firedAlert, setFiredAlert] = useState<RateAlert | null>(null);

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

  // Upstream ships wrong/blank names for a handful of codes — apply the local
  // corrections so the list modal, search dropdown, and row tooltips agree.
  const displayNames = useMemo<Record<string, string>>(
    () => ({ ...(effectiveAll ?? {}), ...CurrencyNameOverrides }),
    [effectiveAll]
  );

  // Reusable tour launcher — shared by the gated auto-start effect and the
  // ungated "?" replay button (D-04). Self-destroys any existing instance
  // first so a replay never stacks two overlays / leaks the previous driver.
  // Does NOT read or write tourSeenAtom (D-03) and does NOT check any gates —
  // gating is the caller's responsibility.
  const startTour = useCallback(async () => {
    // Lazy-loaded: keeps driver.js out of the initial bundle (returning visitors never need it).
    const { driver } = await import('driver.js');
    tourDriverRef.current?.destroy(); tourDriverRef.current = null;

    // D-01/D-02: tour locale is the app's single source of truth (languageAtom),
    // not navigator.languages — switching language in Settings then replaying
    // the tour must show the new language. The navigator-based resolver is
    // reused only for the first-load device-default effect above (D-03).
    const steps = buildTourSteps(language);

    // Pre-filter steps whose anchor selector isn't present in the DOM (silent
    // skip — driver.js throws at drive-time on an unresolvable selector).
    // Keep element-less steps (the welcome card) unconditionally.
    const filteredSteps = steps
      .filter((step) => !step.element || document.querySelector(step.element as string))
      .map((step) => {
        if (step.element !== '[data-tour="tour-install"]') return step;
        // Install anchor may be present with no button rendered (no captured
        // beforeinstallprompt). Swap in the fallback copy without mutating
        // the original step object; never drop step 8 (TOUR-06). ALSO drop
        // the element anchor in that case: spotlighting the empty div drew a
        // stray ring at the foot of the page on phones (seen live 2026-10-08)
        // — an anchor-less step renders as a centered card instead.
        const hasInstallButton = document.querySelector('[data-tour="tour-install"] button');
        if (hasInstallButton) return step;
        const stepWithoutAnchor = { ...step };
        delete stepWithoutAnchor.element;
        return { ...stepWithoutAnchor, popover: { ...step.popover, description: getTourString(language, 'step8FallbackBody') } };
      });

    // One-time theme read for the overlay scrim only — do NOT re-init driver
    // on theme change; popover colors themselves come from tour.css tokens.
    const isDarkTheme = document.documentElement.getAttribute('data-theme') !== 'light';

    // One-time reduced-motion read (A11Y-01, D-07 item 3), same "read once
    // per drive() call, do not subscribe" shape as isDarkTheme above. Paired
    // with the CSS-side @media (prefers-reduced-motion: reduce) block in
    // tour.css (defense in depth — JS flag disables driver.js's own
    // animate/smoothScroll behavior, CSS zeroes its transition duration).
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const driverObj: Driver = driver({
      steps: filteredSteps,
      allowClose: true,
      overlayClickBehavior: 'close',
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      animate: !prefersReducedMotion,
      smoothScroll: !prefersReducedMotion,
      stagePadding: 4,
      showProgress: true,
      overlayColor: isDarkTheme ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.45)',
      nextBtnText: getTourString(language, 'nextBtn'),
      prevBtnText: getTourString(language, 'prevBtn'),
      doneBtnText: getTourString(language, 'doneBtn'),
      // RTL Contract: popover is a detached DOM node outside React's tree, so
      // `dir` must be set imperatively. Fires once per step (Pitfall 5) —
      // body stays a single idempotent attribute write, no listeners. Only
      // the popover node gets `dir`; <html>/<body> are never touched (no
      // app-wide RTL this phase). Footer button visual mirroring is CSS-only
      // ([dir="rtl"] .driver-popover-footer in tour.css) — DOM/tab order and
      // next/prev click handlers are untouched (Pitfall 6).
      onPopoverRender: (popoverDom) => {
        popoverDom.wrapper.dir = RTL_LOCALES.has(language) ? 'rtl' : 'ltr';
      },
      // driver sets aria-haspopup/expanded/controls on the role-less dummy element
      // used for element-less steps. With animate:false it does so after
      // onPopoverRender, so strip them here (onHighlighted always fires later).
      onHighlighted: () => {
        const dummy = document.getElementById('driver-dummy-element');
        ['aria-haspopup', 'aria-expanded', 'aria-controls'].forEach((a) => dummy?.removeAttribute(a));
      },
      // Focus restoration (D-07 item 2): NO manual restore code here by
      // design. driver.js 1.6.0 captures document.activeElement internally
      // at drive()-time and restores it on every exit path below (Done,
      // Close, Escape, overlay click) — verified via a keyboard-driven
      // (Tab+Enter) Playwright baseline in e2e/tour.spec.ts BEFORE any of
      // this task's code was written (03-RESEARCH.md Pitfall 3, 03-03-PLAN
      // Task 1). The baseline passed against the pre-Task-3 code, so a
      // second, redundant restore closure would only risk a double-focus
      // event for zero accessibility gain. Do not add one.
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
        // Defensive: driver.js locks body scroll while driving; the Escape
        // path has intermittently left it locked (seen live 2026-10-08 — the
        // page stopped scrolling until reload). destroy() should restore it,
        // but never trust it: force-clear both locks here.
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      },
    });

    // Hold the instance in a ref so ONLY a real unmount (or the next startTour()
    // call) tears it down. Do NOT destroy from a useEffect cleanup keyed on
    // reactive deps: effectiveAll changes identity when the network fetch
    // resolves after the cached value, which would re-run that effect and
    // destroy the tour milliseconds after it starts (→ onDestroyed sets
    // tourSeen, so it never reappears).
    tourDriverRef.current = driverObj;
    driverObj.drive();
    // `language` must stay in this dependency array (Pitfall 1): omitting it
    // would let startTour close over a stale locale after a Settings language
    // switch, since useCallback only recreates the function when a listed dep
    // changes. This is safe against the a818626 teardown bug — destruction
    // only happens inside this function body and the unmount-only cleanup
    // effect below; the dep-array change affects function identity only.
  }, [language, setTourSeen]);

  // First-run guided tour: auto-starts once hydrated, real content is rendered
  // (not the skeleton), and the tour hasn't been seen yet. Guarded against
  // React Strict Mode's dev double-invoke by tourStartedRef. Deferred to browser
  // idle so driver.js's layout reads don't force reflows inside the hydration
  // long task. tourStartedRef is set in the callback, not here: a dep re-run
  // cancels the pending callback and reschedules, so the tour can't be skipped.
  useEffect(() => {
    if (!hydrated || tourSeen || !effectiveAll || tourStartedRef.current) return;
    const run = () => { tourStartedRef.current = true; startTour(); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 200);
    return () => clearTimeout(id);
  }, [hydrated, tourSeen, effectiveAll, startTour]);

  // Destroy the tour only on genuine unmount, never on dependency-change re-runs.
  useEffect(() => () => { tourDriverRef.current?.destroy(); tourDriverRef.current = null; }, []);

  const effectiveBaseCur = useMemo<CurrencyRate4BaseCur | undefined>(
    () => data4BaseCur ?? (hydrated ? getDataFromLocalStorage(rateCacheKey(baseCur), undefined) : undefined),
    [data4BaseCur, baseCur, hydrated]
  );
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

  // Pin/unpin a currency — pinned rows float above the sort order (C).
  const onTogglePin = useCallback((cur: string) => {
    setPinnedCurrencies(prev => prev.includes(cur) ? prev.filter(c => c !== cur) : [...prev, cur]);
  }, [setPinnedCurrencies]);

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
  // Pinned currencies float to the top in pin order, ahead of the sort (C).
  const rows = useMemo(() => {
    const sorted = sortCurrencyPairs(currencyRatesPairs2Display, isEditing ? 'custom' : sortMode, (c) => changePctByCur[c]);
    if (isEditing || pinnedCurrencies.length === 0) return sorted;
    const byCode = new Map(sorted.map(pair => [pair[0], pair]));
    const pinned = pinnedCurrencies.flatMap(c => byCode.has(c) ? [byCode.get(c)!] : []);
    const pinnedSet = new Set(pinnedCurrencies);
    return [...pinned, ...sorted.filter(([code]) => !pinnedSet.has(code))];
  },
    [currencyRatesPairs2Display, isEditing, sortMode, changePctByCur, pinnedCurrencies]
  );
  // Drag-drop needs natural flow, so only virtualize large, read-only (non-editing) lists.
  const shouldVirtualize = !isEditing && rows.length > VIRTUALIZE_THRESHOLD;

  // Rate alerts (A): evaluate every untriggered alert whenever fresh rates
  // arrive. Same-base alerts read the already-fetched table; cross-base ones
  // go through the app's own /api/convert (one request per alert).
  useEffect(() => {
    const pending = rateAlerts.filter(a => !a.triggered);
    if (pending.length === 0 || !effectiveBaseCur) return;
    let cancelled = false;

    const getRate = async (a: RateAlert): Promise<number | undefined> => {
      if (a.from.toLowerCase() === baseCur.toLowerCase()) {
        const t = (effectiveBaseCur?.[baseCur] as CurrencyRates | undefined)?.[a.to];
        if (typeof t === 'number') return t;
      }
      try {
        const res = await fetch(`/api/convert?from=${encodeURIComponent(a.from)}&to=${encodeURIComponent(a.to)}&amount=1`);
        if (!res.ok) return undefined;
        const j = await res.json();
        return typeof j.rate === 'number' ? j.rate : undefined;
      } catch {
        return undefined; // offline — skip this round
      }
    };

    (async () => {
      const fired: { alert: RateAlert; rate: number }[] = [];
      for (const a of pending) {
        const rate = await getRate(a);
        if (rate === undefined) continue;
        if (a.direction === 'above' ? rate >= a.target : rate <= a.target) fired.push({ alert: a, rate });
      }
      if (cancelled || fired.length === 0) return;
      const ids = new Set(fired.map(f => f.alert.id));
      setRateAlerts(prev => prev.map(a => (ids.has(a.id) ? { ...a, triggered: true } : a)));
      const { alert, rate } = fired[0];
      setFiredAlert(alert);
      vibrate(haptics, 40);
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('💱 Rate alert', {
            body: `1 ${alert.from.toUpperCase()} = ${rate} ${alert.to.toUpperCase()} (${alert.direction === 'above' ? '≥' : '≤'} ${alert.target})`,
          });
        }
      } catch { /* notifications best-effort */ }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBaseCur, rateAlerts]);

  // Share-as-image (D): render a rate-card PNG and share it (Web Share files)
  // or download it when sharing isn't available.
  const doShareImage = useCallback(async () => {
    setShareMenuOpen(false);
    vibrate(haptics);
    const cardRows = rows
      .filter(([c]) => c !== baseCur)
      .slice(0, 8)
      .map(([c, v]) => ({
        code: c,
        text: (v * currencyValue).toLocaleString(undefined, { minimumFractionDigits: defaultCurrencyValueDp, maximumFractionDigits: defaultCurrencyValueDp }),
      }));
    const dateStr = (ratesDate ? new Date(ratesDate + 'T00:00:00') : new Date())
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    await shareRateCard({ baseCur, amount: String(currencyValue), rows: cardRows, footerDate: `Rates as of ${dateStr}` });
  }, [rows, baseCur, currencyValue, defaultCurrencyValueDp, ratesDate, haptics]);

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
      name={displayNames[cur]}
      changePct={historicalDate ? undefined : changePctByCur[cur]}
      showDivider={index < rows.length - 1}
      style={style}
      showChangePct={showChangePct}
      compact={compactRows}
      copyFormat={copyFormat}
      showPinButton={showPinButtons}
      haptics={haptics}
      isPinned={pinnedCurrencies.includes(cur)}
      onDragStart={onDragStart}
      onSelectBase={onBaseCurChange}
      onRemove={removeCurrency2Display}
      onValueChange={handleCurrencyValueChange}
      onTogglePin={onTogglePin}
    />
  );

  if ((err1 || err2) && !effectiveBaseCur) return (
    <div className="text-center p-8">
      <p>Error fetching data. Please try again later.</p>
      <button type="button" className="btn btn-primary btn-sm mt-4" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
  // Rows need both tables; ending the skeleton when only one has arrived empties the list and jumps the footer (CLS).
  const showSkeleton = (isLoad1 && !effectiveAll) || (isLoad2 && !effectiveBaseCur);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        {/* px-2 (not p-4): rows get maximum width for long converted values on phones. */}
        <div className='grid grid-cols-1 justify-between m-auto max-w-[800px] px-2 py-4'>
          {/* Icon row, then the search on its own full-width line below —
              five 44px buttons plus a search input never fit one 360px row. */}
          <div className='w-full'>
            <div className='flex gap-2 w-full items-center mb-2'>
              <CurrencyListModal data={displayNames} baseCur={baseCur} />
              {/* Share menu: copy link (existing) + share-as-image rate card (D). */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => { vibrate(haptics); setShareMenuOpen(v => !v); }}
                  title={i18n.settings.shareTitle}
                  aria-label={i18n.settings.shareTitle}
                  aria-expanded={shareMenuOpen}
                  aria-haspopup="menu"
                  data-tour="tour-share"
                  className="h-[44px] w-[44px] flex items-center justify-center relative"
                >
                  <ShareSvg />
                  {shareCopied && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap opacity-70">Copied!</span>
                  )}
                </button>
                {shareMenuOpen && (
                  <>
                    <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setShareMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-box bg-base-200 shadow-lg p-1 flex flex-col" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="btn btn-ghost btn-sm justify-start gap-2"
                        onClick={() => { setShareMenuOpen(false); vibrate(haptics); onShare(); }}
                      >
                        <ShareSvg className="size-5" />{i18n.settings.shareCopyLink}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="btn btn-ghost btn-sm justify-start gap-2"
                        onClick={doShareImage}
                      >
                        <ImageSvg className="size-5" />{i18n.settings.shareImage}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => startTour()}
                title={i18n.tour.replayLabel}
                aria-label={i18n.tour.replayLabel}
                className="tour-replay-btn h-[44px] w-[44px] shrink-0 flex items-center justify-center"
              >
                <QuestionSvg />
              </button>
              {/* Language menu: one-tap globe in the top bar — the settings
                  select buried it where nobody looked. Same 30 languages as
                  the settings select (languageOptions, single source). */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => { vibrate(haptics); setLangMenuOpen(v => !v); }}
                  title={i18n.settings.changeLanguage}
                  aria-label={i18n.settings.changeLanguage}
                  aria-expanded={langMenuOpen}
                  aria-haspopup="menu"
                  className="h-[44px] w-[44px] shrink-0 flex items-center justify-center"
                >
                  <GlobeSvg />
                </button>
                {langMenuOpen && (
                  <>
                    <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 w-44 max-h-72 overflow-y-auto rounded-box bg-base-200 shadow-lg p-1 flex flex-col" role="menu">
                      {languageOptions.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={language === value}
                          className={`btn btn-ghost btn-sm justify-start ${language === value ? 'text-primary font-semibold' : ''}`}
                          onClick={() => { setLanguage(value); setLangMenuOpen(false); vibrate(haptics); }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <ThemeToggle />
              {/* One-tap historical rates — the picker used to hide behind a
                  settings checkbox nobody found (moved out of settings 2026-10-08). */}
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                title="Historical rates"
                aria-label="Historical rates"
                aria-pressed={showDatePicker}
                // The tour's "Look up past rates" step anchors here (always in
                // the DOM) instead of the date input below, which only renders
                // while the picker is open — the pre-filter used to drop the
                // step on every auto-run tour.
                data-tour="tour-historical-date"
                className={`h-[44px] w-[44px] shrink-0 flex items-center justify-center ${showDatePicker ? 'text-primary' : ''}`}
              >
                <CalendarSvg />
              </button>
            </div>
            <SearchBar data={displayNames} />
          </div>

          {/* Data freshness — the API only gives day precision, so show the
              date rather than fake "x minutes ago" precision. Rendered in the
              APP's language (not the browser's) so it matches the label.
              Hidden while the historical date picker is open (it shows the
              date itself). */}
          {ratesDate && /^\d{4}-\d{2}-\d{2}$/.test(ratesDate) && !showDatePicker && (
            <p className="text-center text-[10px] opacity-50 -mt-1 mb-1 tabular-nums">
              {i18n.home.ratesAsOf}{' '}
              {new Date(ratesDate + 'T00:00:00').toLocaleDateString(language, { month: 'short', day: 'numeric' })}
            </p>
          )}

          <AffiliateLinks />

          {showDatePicker && (
            <div className="text-center text-xs opacity-60 mb-2 flex flex-wrap items-center justify-center gap-2">
              <span>{i18n.home.ratesAsOf}</span>
              <input
                type="date"
                max={todayStr}
                value={historicalDate || ratesDate || todayStr}
                onChange={(e) => setHistoricalDate(e.target.value)}
                aria-label={i18n.home.ratesAsOf}
                className="bg-base-200 rounded px-1"
              />
              {historicalDate && (
                <button type="button" className="underline" onClick={() => setHistoricalDate('')}>{i18n.home.today}</button>
              )}
            </div>
          )}

          {/* Quick amounts (B) — one tap instead of typing. */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2" role="group" aria-label="Quick amounts">
            {[10, 50, 100, 500, 1000].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => { vibrate(haptics); handleCurrencyValueChange(v); }}
                aria-pressed={currencyValue === v}
                className={`btn btn-sm shrink-0 tabular-nums ${currencyValue === v ? 'btn-primary' : 'btn-ghost'}`}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Fired rate alert banner (A) — the atom already marks it triggered. */}
          {firedAlert && (
            <div className="alert alert-success mb-2 py-2 px-3" role="status">
              <BellSvg className="size-5 shrink-0" />
              <span className="text-sm flex-1 tabular-nums">
                1 {firedAlert.from.toUpperCase()} {firedAlert.direction === 'above' ? '≥' : '≤'} {firedAlert.target} {firedAlert.to.toUpperCase()} — {i18n.settings.alertTargetHit}
              </span>
              <button type="button" className="btn btn-ghost btn-xs shrink-0" onClick={() => setFiredAlert(null)}>
                {i18n.settings.dismiss}
              </button>
            </div>
          )}

          {showSkeleton ? (
            <div>
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
            </div>
          ) : shouldVirtualize ? (
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

