"use client";
import * as _ from "lodash";
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetcher, getCurrencyRateApiUrl } from './api';
import CountryImg from './components/CountryImg';
import CurrencyListModal from './components/CurrencyListModal';
import SearchBar from './components/SearchBar';
import { DefaultBaseCur, DefaultCurrency2Display, DefaultCurrencyValue } from './constants';
import { CrossSvg } from './svgs';

type CurrencyRates = {
  [key: string]: number;
};

export default function Home() {
  const inputObj = useRef<CurrencyRates>({});

  const [baseCur, setBaseCur] = useState<string>(DefaultBaseCur);
  const [currency2Display, setCurrency2Display] = useState<string[]>(DefaultCurrency2Display);
  const [currencyValue, setCurrencyValue] = useState<number>(DefaultCurrencyValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isDefaultCurrencyValue, setIsDefaultCurrencyValue] = useState(true);
  const [defaultCurrencyValue, setDefaultCurrencyValue] = useState(DefaultCurrencyValue);

  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(getCurrencyRateApiUrl({}), fetcher,);
  const { data: data4BaseCur, error: err2 } = useSWR<CurrencyRate4BaseCur>(getCurrencyRateApiUrl({ baseCurrencyCode: baseCur }), fetcher,);

  if (data4All) {
    data4All['rmb'] = data4All['cny'];
  }
  if (data4BaseCur) {
    // Type assertion to ensure TypeScript recognizes the type

    if (baseCur === 'rmb') {
      data4BaseCur['rmb'] = data4BaseCur['cny'];
      // delete data4BaseCur['cny']
    } else {
      // Type assertion to ensure TypeScript recognizes the type
      if (data4BaseCur[baseCur] && typeof data4BaseCur[baseCur] === 'object') {
        (data4BaseCur[baseCur] as CurrencyRates)['rmb'] = (data4BaseCur[baseCur] as CurrencyRates)['cny'];
      }
    }
  }

  const curObj: CurrencyRates = _.pick(data4BaseCur?.[baseCur] as CurrencyRates, currency2Display.includes('rmb') ? [...currency2Display, 'cny'] : currency2Display)
  const currencyRatesPairs2Display: [string, number][] = Object.entries(curObj) || [];

  if (baseCur === 'rmb' && data4BaseCur) {
    currencyRatesPairs2Display.push(['rmb', (data4BaseCur[baseCur] as CurrencyRates)['rmb']])
  }

  useEffect(() => {
    // Initialize state from localStorage after component mounts

    const storedCurrency2Display = localStorage.getItem("currency2Display");
    if (storedCurrency2Display) {
      setCurrency2Display(JSON.parse(storedCurrency2Display));
    }

    const storedBaseCur = localStorage.getItem("baseCur");
    if (storedBaseCur) {
      setBaseCur(storedBaseCur);
    } else {
      setBaseCur(currency2Display[0])
    }

    const storedCurrencyValue = localStorage.getItem("currencyValue");
    if (storedCurrencyValue) {
      setCurrencyValue(JSON.parse(storedCurrencyValue));
    }

    const storedIsDefaultCurrencyValue = localStorage.getItem("isDefaultCurrencyValue");
    if (storedIsDefaultCurrencyValue) {
      setIsDefaultCurrencyValue(JSON.parse(storedIsDefaultCurrencyValue));
    }

    const storedDefaultCurrencyValue = localStorage.getItem("defaultCurrencyValue");
    if (storedDefaultCurrencyValue) {
      setDefaultCurrencyValue(JSON.parse(storedDefaultCurrencyValue ?? 100));
    }

    const storedIsEditing = localStorage.getItem("isEditing");
    if (storedIsEditing) {
      setIsEditing(JSON.parse(storedIsEditing));
    }
  }, []);

  useEffect(() => {
    if (curObj) {
      if (curObj['cny'] && currency2Display.includes('rmb')) {
        curObj['rmb'] = curObj['cny'];
      }
    }
    inputObj.current = curObj;
  }, [curObj, currency2Display]);

  const addCurrency2Display = ({ name }: { name: string }) => {
    setCurrency2Display(cur => {
      const newCurrency2Display = [...cur, name];
      localStorage.setItem("currency2Display", JSON.stringify(newCurrency2Display));
      return newCurrency2Display;
    });
  }

  const removeCurrency2Display = ({ name }: { name: string }) => {
    setCurrency2Display(cur => {
      const newCurrency2Display = cur.filter(c => c !== name);
      localStorage.setItem("currency2Display", JSON.stringify(newCurrency2Display));
      return newCurrency2Display;
    });
  }

  const onBaseCurChange = (cur: string) => {
    if (isDefaultCurrencyValue) {
      setCurrencyValue(defaultCurrencyValue || 100);
    } else {
      const data = inputObj.current;
      const dataAfter = Object.entries(data).reduce<CurrencyRates>((acc, [code, val]) => {
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

  if (err1 || err2) return <div className="text-center">failed to load</div>;
  if (isLoad1) return <progress className="progress w-full mt-[2px]"></progress>; //<span className="loading loading-infinity loading-lg"></span>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        <div className='grid grid-cols-1 justify-between gap-6 gap-y-6 m-6'>
          <SearchBar data={data4All ?? {}} onSelect={addCurrency2Display} selected={currency2Display} />

          {(currencyRatesPairs2Display).map(([cur, val], i) => {
            // if ((!currency2Display.includes('cny') && baseCur !== 'cny' && cur === 'cny')) { return null }
            const val2Show = (val * currencyValue).toLocaleString(undefined, { minimumFractionDigits: ((val * currencyValue > 1) ? 3 : 10) }) ?? 0;

            return <div key={i} className='flex gap-2 h-42 items-center'>
              {cur === baseCur
                ? null
                : isEditing
                  ? <CrossSvg className={'cursor-pointer size-6'} onClick={() => removeCurrency2Display({ name: cur })} />
                  : null}

              <CountryImg code={cur} />

              <div className='flex w-full justify-between'>
                <div className='w-1/2 sm:w-3/10 text-start'>
                  <div className="tooltip" data-tip={data4All ? data4All[cur] : ''}>
                    {cur.toUpperCase()}
                  </div>
                </div>

                {cur === baseCur
                  ? <input min={0} onChange={handleCurrencyValue} step=".01"
                    value={currencyValue} type="number" placeholder="🔍" className="bg-black h-[2em] max-w-[50vw] sm:max-w-7/10 text-end" />
                  : <div onClick={() => onBaseCurChange(cur)} className='w-1/2 text-end'>
                    {val2Show}
                  </div>}
              </div>
            </div>
          })}

        </div>
      </main>
      <CurrencyListModal data={data4All ?? {}} currency2Display={currency2Display} addCurrency2Display={addCurrency2Display} removeCurrency2Display={removeCurrency2Display}
        isDefaultCurrencyValue={isDefaultCurrencyValue} setIsDefaultCurrencyValue={setIsDefaultCurrencyValue}
        defaultCurrencyValue={defaultCurrencyValue} setDefaultCurrencyValue={setDefaultCurrencyValue}
        isEditing={isEditing} setIsEditing={setIsEditing}
      />
    </div>
  )
}
