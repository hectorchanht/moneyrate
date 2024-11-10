import Image from 'next/image';
import { useMemo, useState, memo } from 'react';
import { Currency2country } from '../constants';
import { QuestionMarkSvg } from '../svgs';


// Define the props interface
interface CountryImgProps {
  code: string; // Replace with the actual type of 'code' if different
  alt?: string:
}

const CountryImg: React.FC<CountryImgProps> = ({ code = '', alt = '' }) => {
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
      return <Image 
        height={42} width={42}
        alt={alt ?? code}
        src={`/country-flags/commodity.png`}
        placeholder='blur' blurDataURL='/img/q.svg'
      />
    }
    if (isError2) {
      return <Image 
        height={42} width={42}
        alt={alt ?? code}
        src={'/img/q.svg'}
        placeholder='blur' blurDataURL='/img/q.svg'
      />;
    }
    if (imageSrc?.includes('/crypto-icons')) {  // if not found as crypto
      return <Image 
        height={42} width={42}
        alt={alt ?? code}
        src={`https://assets.coincap.io/assets/icons/${code}@2x.png`}
        onError={() => setIsError2(true)}
        placeholder='blur' blurDataURL='/img/q.svg'
      />
    }
    return <Image 
      height={42} width={42}
      alt={alt ?? code}
      src={'/img/q.svg'}
      placeholder='blur' blurDataURL='/img/q.svg'
    />;
  }

  if (imageSrc === '' || !imageSrc) {
    return <QuestionMarkSvg className="size-8" width={42} />;
  }

  return (
    <Image 
      height={42} width={42}
      alt={alt ?? code}
      src={imageSrc}
      onError={() => setIsError(true)}
      placeholder='blur'
      blurDataURL='/img/q.svg'
    />
  );
};

// Custom comparison function to only re-render when 'code' changes
function areEqual(prevProps: CountryImgProps, nextProps: CountryImgProps) {
  return prevProps.code === nextProps.code;
}


export default memo(CountryImg, areEqual);
