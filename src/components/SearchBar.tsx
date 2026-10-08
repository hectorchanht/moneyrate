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
  const [highlight, setHighlight] = useState(0);
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

    // Dedupe: a currency whose code AND name both match would otherwise appear twice.
    return Array.from(new Set(filteredMatches.concat(filteredMatches2)));
  }, [query, data]);

  // The rows actually shown in the dropdown (not-yet-displayed, capped at 10).
  const visible = useMemo(
    () => matched.filter((m) => !currency2Display.includes(m)).slice(0, 10),
    [matched, currency2Display]
  );

  // Keep the highlighted index within range as results change.
  const activeIndex = Math.min(highlight, Math.max(0, visible.length - 1));

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

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((i) => Math.min(i + 1, Math.max(0, visible.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault(); // also stops the form from submitting/reloading
      const code = visible[activeIndex];
      if (code) {
        onSelect(code);
        clearQuery();
      }
    }
  };

  return (
    <div className='w-full'>
      <form className={'w-full flex justify-between items-center relative'} onSubmit={(e) => e.preventDefault()} >
        <input
          placeholder={t.home.searchPlaceholder}
          type={'text'}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-label="Search currencies to add"
          aria-expanded={visible.length > 0 && query.length > 0}
          aria-controls="search-results"
          data-tour="tour-search"
          className="w-full bg-base-200 rounded-lg border border-base-300 pl-3 pr-10 py-2.5 text-sm placeholder:truncate focus:outline-none focus:border-primary/50"
        />

        <span className={'absolute right-2 top-1/2 -translate-y-1/2 inline-flex cursor-pointer items-center opacity-70'}>
          {!query.length
            ? <SearchSvg className="size-5" />
            : <DeleteSvg className="size-5" onClick={clearQuery} />
          }
        </span>
      </form>

      {visible.length > 0 && query.length > 0
        ? <div id="search-results" role="listbox" className={'overflow-hidden bg-base-200 rounded-b-lg border border-t-0 border-base-300'}>
          {visible.map((code: string, index: number) =>
            <div key={code}
              role="option"
              aria-selected={index === activeIndex}
              className={`p-3 cursor-pointer flex justify-between items-center ${index === activeIndex ? 'bg-base-content/10' : ''}`}
              onMouseEnter={() => setHighlight(index)}
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

      {/* NOTE (v1): English-only string; the site's 30 locales fall back to it. */}
      {query.length > 0 && visible.length === 0
        ? <div className="bg-base-200 rounded-b-lg border border-t-0 border-base-300 px-3 py-2 text-sm opacity-60">
          No matching currencies
        </div>
        : null}
    </div>
  )
};

export default SearchBar;
