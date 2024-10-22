"use client";
import { useEffect, useRef, useState } from 'react';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import useSWR from 'swr';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetcher, getApiUrl } from './api';
import * as _ from "lodash";
import CurrencyListModal from './components/CurrencyListModal'

type SearchItem = {
  id: string;
  name: string;
};


const MoneySvg = ()=><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg>;

const CrossSvg = ({cur, removeCurrency2Display}: {cur: string, removeCurrency2Display: (item: { name: string }) => void}) => <svg onClick={() => removeCurrency2Display({ name: cur })}
xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 cursor-pointer">
<path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>;


export default function Home() {
  const inputObj = useRef<CurrencyRates>({});
  
  const [query, setQuery] = useState('');
  const [baseCur, setBaseCur] = useState<string>('usd');
  const [currency2Display, setCurrency2Display] = useState<string[]>(['usd', 'hkd', 'cad', 'jpy', 'btc', 'eth']);
  const [currencyValue, setCurrencyValue] = useState<number>(1);

  useEffect(() => {
    // Initialize state from localStorage after component mounts
    const storedBaseCur = localStorage.getItem("baseCur");
    if (storedBaseCur) {
      setBaseCur(storedBaseCur);
    }

    const storedCurrency2Display = localStorage.getItem("currency2Display");
    if (storedCurrency2Display) {
      setCurrency2Display(JSON.parse(storedCurrency2Display));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("baseCur", (baseCur));
    }
  }, [baseCur]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("currency2Display", JSON.stringify(currency2Display));
    }
  }, [currency2Display]);

  const addCurrency2Display = ({ name }: { name: string }) => {
    setCurrency2Display(d => [...d, name]);
    setQuery('');
    // const divElements = document.querySelectorAll('.clear-icon');
    // divElements.forEach((divElement) => {
    //   divElement.click();
    // });
  }

  const removeCurrency2Display = ({ name }: { name: string }) => {
    setCurrency2Display(d => d.filter(c => c !== name));
    setQuery('');
  }

  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(getApiUrl({}), fetcher,);
  const { data: data4BaseCur, error: err2 } = useSWR<CurrencyRate4BaseCur>(getApiUrl({ baseCurrencyCode: baseCur }), fetcher,);

  const allCurrency: string[] = data4All ? Object.keys(data4All) : [];


  type CurrencyRates = {
    [key: string]: number;
  };

  const curObj: CurrencyRates = _.pick(data4BaseCur?.[baseCur] as CurrencyRates, currency2Display)
  const currencyRatesPairs2Display: [string, number][] = Object.entries(curObj) || [];
  
  const onBaseCurChange = (cur: string) => {
    const data = inputObj.current;
    const dataAfter = Object.entries(data).reduce<CurrencyRates>((acc, [code, val]) => {
      if (code === baseCur) {
        acc[code] = val;
      } else {
        acc[code] = val * currencyValue;
      }
      return acc;
    }, {});

    setCurrencyValue(dataAfter[cur] || 0);
    setBaseCur(cur);
  }

  useEffect(() => {
    inputObj.current = curObj;
  }, [curObj]);
  
  const handleCurrencyValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrencyValue(parseFloat(e.target.value));
  }

  if (err1 || err2) return <div>failed to load</div>;
  if (isLoad1) return <progress className="progress w-full mt-[2px]"></progress>; //<span className="loading loading-infinity loading-lg"></span>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        <div className='grid grid-cols-1 justify-between gap-6 gap-y-6 m-6'>
          <ReactSearchAutocomplete<SearchItem>
            items={allCurrency.filter(c => !currency2Display.includes(c)).map(c => ({ id: c, name: c }))}
            onSelect={addCurrency2Display} placeholder={'search and add more currency here'}
            inputSearchString={query}
          />

          {currencyRatesPairs2Display.map(([cur, val], i) => {
            const val2Show = (val * currencyValue).toLocaleString(undefined, { minimumFractionDigits: ((val * currencyValue > 1) ? 3 : 10) }) ?? 0;
            
            return <div key={i} className='flex gap-2 gap-y-2 h-42'>
              {cur === baseCur
                ? <MoneySvg />
                : <CrossSvg cur={cur} removeCurrency2Display={removeCurrency2Display} />}

              <div className='flex w-full'>
                <div className='w-1/2 text-start'>
                  {cur.toUpperCase()}
                </div>

                {cur === baseCur
                  ? <input min={0} onChange={handleCurrencyValue} step=".01"
                    value={currencyValue} type="number" placeholder="🔍" className="bg-black rounded-[24px] h-[1em] max-w-[33%]" />
                  : <div onClick={() => onBaseCurChange(cur)} className='w-1/2 text-start pl-[14px]'>
                  {val2Show}
                </div>}
            </div>
          </div>})}

        </div>
      </main>
      <CurrencyListModal data={data4All ?? {}}/>
    </div>
)
}
