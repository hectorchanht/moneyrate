"use client";
import { useEffect, useState } from 'react';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import useSWR from 'swr';
import { CurrencyRate4All, CurrencyRate4BaseCur, fetcher, getApiUrl } from './api';
const _ = require('lodash/core');


type SearchItem = {
  id: string;
  name: string;
};


const MoneySvg = ()=><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg>;

const CrossSvg = ({cur, removeCurrency2Display}) => <svg onClick={() => removeCurrency2Display({ name: cur })}
xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 cursor-pointer">
<path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>;


export default function Home() {
  const [query, setQuery] = useState('');
  const [baseCur, setBaseCur] = useState<string>((localStorage.getItem("baseCur")) || 'usd');
  const [currency2Display, setCurrency2Display] = useState<string[]>(JSON.parse(localStorage.getItem("currency2Display") ?? '[]') || [baseCur, 'cad', 'jpy']);
  const [currencyValue, setCurrencyValue] = useState<number>(1);
  const [lastCurrencyValue, setLastCurrencyValue] = useState({});


  useEffect(() => {
    localStorage.setItem("baseCur", (baseCur));
  }, [baseCur]);

  useEffect(() => {
    localStorage.setItem("currency2Display", JSON.stringify(currency2Display));
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
  const { data: data4BaseCur, error: err2, isLoading: isLoad2 } = useSWR<CurrencyRate4BaseCur>(getApiUrl({ baseCurrencyCode: baseCur }), fetcher,);

  const allCurrency: string[] = data4All ? Object.keys(data4All) : [];

  const curObj = _.pick(data4BaseCur?.[baseCur], currency2Display)
  const currencyRatesPairs2Display: [string, number][] = Object.entries(curObj) || [];
  // console.log(curObj);

  const onBaseCurChange = (cur: string, val: number) => {
    setCurrencyValue(curObj[cur] || 0);
    setBaseCur(cur);
  }

const handleCurrencyValue = (e) => {
  // setLastCurrencyValue(_.pick(data4BaseUsd?.[baseCur], currency2Display));
  setCurrencyValue(parseFloat(e.target.value));
}

if (err1 || err2) return <div>failed to load</div>;
if (isLoad1) return <div>loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        <div className='grid grid-cols-1 justify-between gap-2 gap-y-2'>
          <ReactSearchAutocomplete<SearchItem>
            items={allCurrency.filter(c => !currency2Display.includes(c)).map(c => ({ id: c, name: c }))}
            onSelect={addCurrency2Display}
            inputSearchString={query}
          />

          {currencyRatesPairs2Display.map(([cur, val], i) => <div key={i} className='flex gap-2 gap-y-2 h-42'>
            {cur === baseCur
              ? <MoneySvg/>
              : <CrossSvg cur={cur} removeCurrency2Display={removeCurrency2Display}/> }

            <div className='flex w-full'>
              <div className='w-1/2 text-center'>
                {cur.toUpperCase()}
              </div>

              {cur === baseCur
                  ? <input min={0} onChange={handleCurrencyValue}
                    value={currencyValue} type="number" placeholder="🔍" className="bg-black rounded-[24px] h-[1em] max-w-[33%]" />
                  : <div onClick={() => onBaseCurChange(cur, val)} className='w-1/2 text-center'>
                    {new Intl.NumberFormat('en-US', { style: 'decimal' }).format(val * currencyValue)}
                  </div>}
            </div>
          </div>)}

        </div>
      </main>

    </div>

)
}