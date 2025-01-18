import Image, { ImageProps } from 'next/image';
import { memo, useMemo, useState } from 'react';
import { Currency2country } from '@/lib/constants';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc: string[];

}
export const ImageWithFallback = (props: ImageWithFallbackProps) => {
  const { src, fallbackSrc, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);
  const [imgIndex, setImgIndex] = useState(0);


  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={rest.alt ?? imgSrc}
      onError={() => {
        setImgSrc(fallbackSrc?.[imgIndex]);
        setImgIndex(imgIndex + 1);
      }}
    />
  );
};


// Define the props interface
interface CountryImgProps {
  code: string; // Replace with the actual type of 'code' if different
  alt?: string;
}

const CountryImg: React.FC<CountryImgProps> = ({ code = '', alt = '' }) => {
  const imageSrc = useMemo(() => {
    const flagSrc = Currency2country[code.toUpperCase() as keyof typeof Currency2country]
      ? `/country-flags/${Currency2country[code.toUpperCase() as keyof typeof Currency2country]}.svg`
      : `/crypto-icons/${code}.svg`;

    return (flagSrc);
  }, [code]);

  return (
    <ImageWithFallback
      height={42} width={42}
      alt={alt ?? code}
      src={imageSrc}
      fallbackSrc={[`/crypto-icons/${code}.png`, '/img/q.svg']}
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
