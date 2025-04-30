import CountryImg from '@/components/CountryImg';
import { useTranslation } from '@/hooks/useTranslation';
import { currency2DisplayAtom } from '@/lib/atoms';
import { DeleteSvg, SearchSvg } from '@/lib/svgs';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface SearchBarProps {
  data: Record<string, string>;
}

const SearchBar: React.FC<SearchBarProps> = ({ data }) => {
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [query, setQuery] = useState('');
  const t = useTranslation();

  const matched = useMemo(() => {
    const filteredMatches = Object.entries(data).reduce((acc: string[], [code]) => {
      if (code.replace(/ /g, '').toLowerCase().includes(query.replace(/ /g, '').toLowerCase())) {
        return [...acc, code]; // Return the updated accumulator
      }
      return acc; // Return the accumulator unchanged if no match
    }, []);

    const filteredMatches2 = Object.entries(data).reduce((acc: string[], [code, name]) => {
      if (name.replace(/ /g, '').toLowerCase().includes(query.replace(/ /g, '').toLowerCase())) {
        return [...acc, code]; // Return the updated accumulator
      }
      return acc; // Return the accumulator unchanged if no match
    }, []);

    return [...filteredMatches, ...filteredMatches2]
  }, [query, data]);

  const clearQuery = () => setQuery('');

  const escFunction = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      // Do whatever when esc is pressed
      clearQuery();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);

    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

  const onSelect = (name: string) => {
    setCurrency2Display(prev => [...prev, name]);
  };

  return (
    <>
      <form className={'w-full flex justify-between items-center overflow-hidden relative'} >
        <input placeholder={t.home.searchPlaceholder} type={'text'} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-black" />

        <span className={'absolute right-1 m-1 inline-flex cursor-pointer items-center'}>
          {!query.length
            ? <SearchSvg />
            : <DeleteSvg onClick={clearQuery} />
          }
        </span>
      </form>

      {matched.length && query.length
        ? <div className={'overflow-hidden bg-black'}>
          {matched.filter(m => !currency2Display.includes(m)).slice(0, 10).map((code: string) =>
            <div key={code} className='p-3 cursor-pointer flex justify-between items-center'
              onClick={() => {
                onSelect(code);
                clearQuery();
              }}>
              <div className='flex gap-2 items-center'>
                <CountryImg code={code} />
                {code}
              </div>
              <span className='text-right'>
                {data[code]}
              </span>
            </div> // Call onSelect when an item is clicked
          )}
        </div>
        : null}
    </>
  )
};

export default SearchBar;
