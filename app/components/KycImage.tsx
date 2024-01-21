import type { ComponentProps } from 'react';

import { useCloudinaryImage } from '~/hooks/useCloudinaryImage';
import { useThumbnail } from '~/hooks/useThumbnail';

interface Props {
  id: number;
  publicId: string;
  label: string;
}
export function KycImage(props: Props) {
  const { id, publicId, label } = props;

  const thumbnailSrc = useThumbnail(publicId);
  const fullImageSrc = useCloudinaryImage(publicId);

  const isUrl = publicId.includes('http');

  return (
    <div
      key={id}
      className="flex flex-col items-stretch justify-center rounded border border-stone-200"
    >
      {!isUrl && (
        <LinkedImage href={fullImageSrc}>
          <img src={thumbnailSrc} alt="KYC Document" className="object-cover" />
        </LinkedImage>
      )}
      {isUrl && (
        <LinkedImage href={publicId}>
          <img src={publicId} alt="KYC Document" className="object-cover" />
        </LinkedImage>
      )}
      <div className="flex flex-col items-center justify-center rounded-b border-t border-stone-200 p-2">
        <span className="text-center text-sm font-semibold text-stone-800">
          {label}
        </span>
      </div>
    </div>
  );
}

function LinkedImage(props: ComponentProps<'a'>) {
  const { href, children, ...restOfProps } = props;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center rounded-t bg-stone-100 transition-all duration-300 hover:scale-[102%]"
      {...restOfProps}
    >
      {children}
    </a>
  );
}
