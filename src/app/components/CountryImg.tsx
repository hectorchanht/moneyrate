import { currency2country } from '../constants';

const CountryImg = ({code = '', alt = '' }: { code: string, alt?: string }) => {

  return (
    <img className="w-[42px] flex-shrink-0"
      alt={alt ?? code}
      src={currency2country[code.toUpperCase() as keyof typeof currency2country]
        ? `/country-flags/${currency2country[code.toUpperCase() as keyof typeof currency2country]}.svg`
        : `/crypto-icons/${code}.svg`
      } />
  );
};

export default CountryImg;
