"use client";

import CountryImg from '@/components/CountryImg';
import CurrencyListModal from '@/components/CurrencyListModal';
import DragHandle from '@/components/DragHandle';
import SearchBar from '@/components/SearchBar';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetcher, getCurrencyRateApiUrl } from '@/lib/api';
import {
  baseCurAtom,
  currency2DisplayAtom,
  currencyValueAtom,
  defaultCurrencyValueAtom,
  defaultCurrencyValueDpAtom,
  isDefaultCurrencyValueAtom,
  isEditingAtom
} from '@/lib/atoms';
import { showASCIIArt } from '@/lib/fns';
import { CrossSvg, EmptySvg } from '@/lib/svgs';
import { useAtom } from 'jotai';
import { pick } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';

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
    script.src = 'https://drag-drop-touch-js.github.io/dragdroptouch/dist/drag-drop-touch.esm.min.js?autoload';
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
  const [baseCur, setBaseCur] = useAtom(baseCurAtom);
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [currencyValue, setCurrencyValue] = useAtom(currencyValueAtom);
  const [isEditing] = useAtom(isEditingAtom);
  const [isDefaultCurrencyValue] = useAtom(isDefaultCurrencyValueAtom);
  const [defaultCurrencyValue] = useAtom(defaultCurrencyValueAtom);
  const [defaultCurrencyValueDp] = useAtom(defaultCurrencyValueDpAtom);

  const { data: data4BaseCur, error: err2 } = useSWR<CurrencyRate4BaseCur>(getCurrencyRateApiUrl({ baseCurrencyCode: baseCur }), fetcher, { keepPreviousData: true });
  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(getCurrencyRateApiUrl({}), fetcher, { keepPreviousData: true });

  const curObj: CurrencyRates = useMemo(() => {
    return pick(data4BaseCur?.[baseCur] as CurrencyRates, currency2Display);
  }, [data4BaseCur, baseCur, currency2Display]);

  const currencyRatesPairs2Display: [string, number][] = useMemo(() => {
    return Object.entries(curObj) || [];;
  }, [curObj]);

  const removeCurrency2Display = (name: string) => {
    setCurrency2Display(prev => prev.filter(c => c !== name));
  };

  const onBaseCurChange = (cur: string) => {
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
    setBaseCur(cur);
    localStorage.setItem("baseCur", (cur));
    localStorage.setItem("defaultCurrencyValue", (defaultCurrencyValue.toString()));
  }

  const handleCurrencyValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrencyValue(parseFloat(e.target.value));
    localStorage.setItem("currencyValue", (e.target.value));
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isEditing) return;
    const dropZone = e.currentTarget; // The drop zone element
    const dropZoneRect = dropZone.getBoundingClientRect(); // Get the bounding rectangle of the drop zone

    // Get the mouse coordinates relative to the drop zone
    const dropY = e.clientY - dropZoneRect.top;

    // Calculate the index of the item where it was dropped
    const itemHeight = 72; // Assuming each currency item has a fixed height
    const itemIndex = Math.floor(dropY / itemHeight); // Calculate the index based on the Y coordinate

    // Now you can use itemIndex to determine where to place the dropped item
    // console.log(`Item dropped at index: ${itemIndex}`);

    const newCurrency2Display = [...currency2Display];
    const draggedIndex = newCurrency2Display.indexOf(currencyItemOnDrag.current);

    const [movedItem] = newCurrency2Display.splice(draggedIndex, 1);
    newCurrency2Display.splice(itemIndex, 0, movedItem);
    setCurrency2Display(newCurrency2Display);
    localStorage.setItem("currency2Display", JSON.stringify(newCurrency2Display));
  };

  if (err1 || err2) return <div className="text-center">Error fetching data. Please try again later.</div>;
  if (isLoad1) return <div className="h-full p-4 grid grid-cols-1 justify-between m-auto max-w-[800px]">
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
          <span className='flex gap-2 w-full'>
            <CurrencyListModal data={data4All ?? {}} />
            <SearchBar data={data4All ?? {}} />
          </span>

          <br />

          <div
            id='currencyList'
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative"
          >
            {(currencyRatesPairs2Display).map(([cur, val], i) => {
              const valMultiplied = val * currencyValue;
              const dp2Show = ((currencyValue === 0) || (valMultiplied > 1))
                ? defaultCurrencyValueDp
                : defaultCurrencyValueDp > 10 ? defaultCurrencyValueDp : 10;
              console.log(` page.tsx --- defaultCurrencyValueDp:`, defaultCurrencyValueDp)

              const val2Show = (valMultiplied).toLocaleString(undefined, { minimumFractionDigits: dp2Show, maximumFractionDigits: dp2Show }) ?? 0;

              return <div key={cur} id='currencyItem'>
                <div className='flex gap-2 h-42 items-center'>

                  {isEditing && <DragHandle onDragStart={() => currencyItemOnDrag.current = cur} />}
                  <div className='flex w-full justify-between items-center gap-4'>
                    <a href={cur === baseCur ? undefined : `/chart?q=${(cur + '-' + baseCur).toUpperCase()}`} className="text-start tooltip flex items-center gap-2" data-tip={data4All ? data4All[cur] : ''}>
                      <CountryImg code={cur} />
                      {cur.toUpperCase()}
                    </a>

                    {cur === baseCur
                      ? <input min={0} onChange={handleCurrencyValue} step="1"
                        value={currencyValue === 0 ? 0 : currencyValue.toFixed(dp2Show)} type="number" placeholder="0" className="bg-black h-[2em] max-w-[50vw] text-end" />
                      : <div onClick={() => onBaseCurChange(cur)} className='w-[240px] text-end'>
                        {val2Show}
                      </div>}

                    {cur === baseCur
                      ? (isEditing ? <EmptySvg /> : null)
                      : (isEditing
                        ? <CrossSvg className={'cursor-pointer size-6'} onClick={() => removeCurrency2Display(cur)} />
                        : null)}
                  </div>
                </div>
                {(i < currencyRatesPairs2Display.length - 1) ? <div className="divider my-2" /> : <br />}
              </div>
            })}
          </div>

        </div>
      </main>
    </div>
  )
}
