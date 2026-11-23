import { useState, type ImgHTMLAttributes } from 'react';

const base = import.meta.env.BASE_URL;

export const stillSrc = (src: string, w: 800 | 1600) => `${base}${src}-${w}.webp`;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string;
  alt: string;
  priority?: boolean;
};

/** Image WebP responsive (800 / 1600), chargée paresseusement avec fondu. */
export function Still({ src, alt, sizes = '100vw', priority, className = '', ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...rest}
      className={`still ${loaded ? 'is-loaded' : ''} ${className}`}
      src={stillSrc(src, 800)}
      srcSet={`${stillSrc(src, 800)} 800w, ${stillSrc(src, 1600)} 1600w`}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      ref={(img) => {
        if (img?.complete && img.naturalWidth && !loaded) setLoaded(true);
      }}
    />
  );
}
