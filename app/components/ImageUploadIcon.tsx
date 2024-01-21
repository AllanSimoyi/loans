import type { Icon as TablerIcon } from 'tabler-icons-react';

import { Loader, Photo, X } from 'tabler-icons-react';

import { useCloudinaryImage } from '~/hooks/useCloudinaryImage';
import { UploadState } from '~/models/imageUploading';

type Props = React.ComponentProps<TablerIcon> & {
  status: UploadState;
  publicId: string;
};

export function ImageUploadIcon(props: Props) {
  const { status, publicId, ...otherProps } = props;
  const imageSrc = useCloudinaryImage(publicId);

  if (status === UploadState.Uploaded) {
    return <img src={imageSrc} alt="Uploaded" className="max-h-[40px]" />;
  }

  if (status === UploadState.Error) {
    return <X {...otherProps} />;
  }

  if (status === UploadState.Uploading) {
    return <Loader className="animate-spin text-stone-400" size={40} />;
  }

  return <Photo size={40} className="text-stone-400" {...otherProps} />;
}
