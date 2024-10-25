import Image from 'next/image';
import { useEffect, useState } from 'react';
import { currency2country } from '../constants';
import { QuestionMarkSvg } from '../svgs';


const isImageFound = async (uri: string) => {
  return await fetch(uri, { method: "HEAD", }).then(({ status }) => status === 200);
};

const CountryImg = ({ code = '', alt = '' }: { code: string, alt?: string }) => {
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const checkImage = async () => {
      const flagSrc = currency2country[code.toUpperCase() as keyof typeof currency2country]
        ? `/country-flags/${currency2country[code.toUpperCase() as keyof typeof currency2country]}.svg`
        : null;

      const cryptoSrc = flagSrc ? null : await isImageFound(`/crypto-icons/${code}.svg`) ? `/crypto-icons/${code}.svg` : `https://assets.coincap.io/assets/icons/${code}@2x.png`;

      setImageSrc(flagSrc || cryptoSrc);
    };

    checkImage();
  }, [code]);

  if (isError) return <QuestionMarkSvg class="size-8" width={42} />;

  return (
    <Image className="w-[42px] flex-shrink-0"
      height={42} width={42}
      alt={alt ?? code}
      src={imageSrc || ''}
      onError={() => setIsError(true)}
    />
  );
};

export default CountryImg;
