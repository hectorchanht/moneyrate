import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Currency2country } from '../constants';
import { QuestionMarkSvg } from '../svgs';


const CountryImg = ({ code = '', alt = '' }: { code: string, alt?: string }) => {
  const [isError, setIsError] = useState(false);
  const [isError2, setIsError2] = useState(false);

  const imageSrc = useMemo(
    () => {
      const flagSrc = Currency2country[code.toUpperCase() as keyof typeof Currency2country]
        ? `/country-flags/${Currency2country[code.toUpperCase() as keyof typeof Currency2country]}.svg`
        : null;

      const cryptoSrc = `/crypto-icons/${code}.svg`;

      return (flagSrc || cryptoSrc);
    },
    [code]
  );

  if (isError) {//commodity
    if (imageSrc?.includes('/country-flags')) {
      return <Image className="w-[42px] flex-shrink-0"
        height={42} width={42}
        alt={alt ?? code}
        src={`/country-flags/commodity.png`}
      />
    }
    if (isError2) {
      return <QuestionMarkSvg className="size-8" width={42} />;
    }
    if (imageSrc?.includes('/crypto-icons')) {  // if not found as crypto
      return <Image className="w-[42px] flex-shrink-0"
        height={42} width={42}
        alt={alt ?? code}
        src={`https://assets.coincap.io/assets/icons/${code}@2x.png`}
        onError={() => setIsError2(true)}
      />
    }
    return <QuestionMarkSvg className="size-8" width={42} />;
  }

  if (imageSrc === '' || !imageSrc) {
    return <QuestionMarkSvg className="size-8" width={42} />;
  }

  return (
    <Image className="w-[42px] flex-shrink-0"
      height={42} width={42}
      alt={alt ?? code}
      src={imageSrc}
      onError={() => setIsError(true)}
    />
  );
};

export default CountryImg;
