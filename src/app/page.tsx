"use client";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useState } from 'react';

import Image from "next/image";
import useSWR from 'swr';
import { CurrencyRate4All, CurrencyRate4BaseCur, getApiUrl } from './api';
const _ = require("lodash");


const fetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then(res => res.json());

{/*
  Heads up! 👋

  Plugins:
    - @tailwindcss/forms
*/}

const Checkbox = ({ options = [] }) => <div >
  <form className="max-w-sm mx-auto">
    <label htmlFor="currency" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select an option</label>
    <select onChange={e => {
      console.log(` page.tsx --- e:`, e.target.value)

    }} defaultValue={''} id="currency" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      <option value='' >💸</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}

    </select>
  </form>
</div>;

interface SearchBarProps {
    allCurrency: string[];
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    selected: string;
    setSelected: (sel: string) => void;
    exclude?: string[];
}

const SearchBar = ({ allCurrency, query='', setQuery, selected, setSelected, exclude=[] }:SearchBarProps) => {
  console.log(` page.tsx --- exclude:`, exclude)
  
  
  // const filteredAllCurrency =
  //   query === ''
  //     ? allCurrency
  //     : allCurrency.filter((c) => {

  //       const isInQuery = c.toLowerCase().includes(query.toLowerCase());
  //       const isExcluded = exclude.includes(c);
  
  //       return isInQuery && !isExcluded;

  //     });
  
      const filteredAllCurrency = query === ''
      ? allCurrency
      : _.filter(allCurrency, c => {
          const isInQuery = c.toLowerCase().includes(query.toLowerCase());
          const isExcluded = _.includes(exclude, c);
    
          return isInQuery && !isExcluded;
        });
  
console.log(` page.tsx --- filteredAllCurrency:`, filteredAllCurrency)

  return (
    <div className="mx-auto h-screen w-52 pt-20">
      <Combobox value={selected} onChange={(value) => setSelected(value)} onClose={() => setQuery('')}>
        <div className="relative">
          <ComboboxInput
            className={clsx(
              'w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3 text-sm/6 text-white',
              'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
            )}
            displayValue={(person) => person}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            <ChevronDownIcon className="size-4 fill-white/60 group-data-[hover]:fill-white" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={clsx(
            'w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
          )}
        >
          {filteredAllCurrency.map((person, i) => (
            <ComboboxOption
              key={i}
              value={person}
              className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
            >
              <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
              <div className="text-sm/6 text-white">{person}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  )

}


export default function Home() {
  const [query, setQuery] = useState('');
  const [selected, setSelected1] = useState('');
  const [currency2Display, setCurrency2Display] = useState(['cad', 'afn']);
  const [baseCur, setBaseCur] = useState(['usd']);

  const setSelected = (sel) => {
    setCurrency2Display(d => [...d, sel]);
    setSelected1('');
  }

  let url4All = getApiUrl({});

  const { data: data4All, error: err1, isLoading: isLoad1 } = useSWR<CurrencyRate4All>(url4All, fetcher,);


  let baseUsd = getApiUrl({ baseCurrencyCode: 'usd' });
  const { data: data4BaseUsd, error: err2, isLoading: isLoad2 } = useSWR<CurrencyRate4BaseCur>(baseUsd, fetcher,);


  const allCurrency = data4All && Object.keys(data4All)



  if (err1 || err2) return <div>failed to load</div>
  if (isLoad1 || isLoad2) return <div>loading...</div>

  let a = Object.entries(_.pick(data4BaseUsd[baseCur], currency2Display))
  console.log(` page.tsx --- data4All:`, data4All, data4BaseUsd, 'a', a);

  return (
    <div className="">
      <main className="">
        {a.map(([cur, val], i) => <div key={i} className='flex justify-center gap-2'>
          <div className='w-1/2 text-center'>
            {cur}
          </div>
          <div className='w-1/2 text-center'>
            {val}
          </div>
        </div>)}
        <SearchBar exclude={currency2Display} allCurrency={allCurrency} query={query} setQuery={setQuery} selected={selected} setSelected={setSelected} />
        <Checkbox options={allCurrency} />




      </main>
    </div>

  )

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">


        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
