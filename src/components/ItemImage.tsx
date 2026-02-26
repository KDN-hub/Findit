'use client';

import { useState } from 'react';
import { getItemImageSrc, ITEM_IMAGE_PLACEHOLDER } from '@/lib/imageUtils';

interface ItemImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Item image that uses backend URL for relative paths and shows Babcock logo on error.
 */
export function ItemImage({ src, alt, className, loading = 'lazy' }: ItemImageProps) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = getItemImageSrc(src);

  if (errored || !resolvedSrc) {
    return (
      <img
        src={ITEM_IMAGE_PLACEHOLDER}
        alt={alt}
        className={className}
        loading={loading}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}
