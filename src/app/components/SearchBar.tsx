import { useCallback, useEffect, useState } from 'react';
import { DeleteSvg, SearchSvg } from '../svgs';
import CountryImg from './CountryImg';

interface SearchBarProps {
  data: { [key: string]: string }; // Updated to reflect the structure of dataList
  onSelect: (params: { name: string }) => void;
  selected: string[];
}


const SearchBar: React.FC<SearchBarProps> = ({ data = {}, onSelect = () => { }, selected = [] }) => {
  const [query, setQuery] = useState('');
  const [matched, setMatched] = useState<string[]>([]);

  useEffect(() => {
    // Update matched to be an array of items that include the query

    const filteredMatches = Object.entries(data).reduce((acc: string[], [code, name]) => {
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

    setMatched([...filteredMatches, ...filteredMatches2]);  // match code then name
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

  return (
    <div>
      <form className={'flex justify-between items-center overflow-hidden'} >
        <input placeholder='Search' type={'text'} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-black" />

        <span className={'absolute right-6 m-1 inline-flex cursor-pointer items-center'}>
          {!query.length
            ? <SearchSvg />
            : <DeleteSvg onClick={clearQuery} />
          }
        </span>
      </form>

      {matched.length && query.length
        ? <div className={'overflow-hidden bg-black'}>
          {matched.filter(m => !selected.includes(m)).slice(0, 10).map((code: string) =>
            <div key={code} className='p-3 cursor-pointer flex justify-between items-center'
              onClick={() => {
                onSelect({ name: code });
                clearQuery();
              }}>
              <div className='flex gap-2 items-center'>
                <CountryImg code={code} />
                {code}
              </div>
              <span>
                {data[code]}
              </span>
            </div> // Call onSelect when an item is clicked
          )}
        </div>
        : null}
    </div>
  )
};

export default SearchBar;
