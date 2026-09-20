import type { ImgHTMLAttributes } from 'react';

type RemoteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  unoptimized?: boolean;
};

/** Render remote media directly so requests do not pass through Vercel's image optimizer. */
export default function RemoteImage({
  fill,
  priority,
  quality: _quality,
  sizes: _sizes,
  unoptimized: _unoptimized,
  className,
  style,
  ...props
}: RemoteImageProps) {
  return (
    <img
      {...props}
      alt={props.alt}
      className={className}
      style={fill ? { ...style, position: 'absolute', inset: 0, width: '100%', height: '100%' } : style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}