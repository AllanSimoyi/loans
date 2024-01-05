import { thumbnail } from '@cloudinary/url-gen/actions/resize';
import { useMemo } from 'react';
import { X } from 'tabler-icons-react';

import { useCloudinary } from './CloudinaryContextProvider';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  isUploading: boolean;
  imageId: string;
  handleRemove: () => void;
}

export function ImageUpload(props: Props) {
  const { isUploading, imageId, handleRemove } = props;

  const { CloudinaryUtil } = useCloudinary();

  const imageUrl = useMemo(() => {
    if (imageId) {
      return CloudinaryUtil.image(imageId)
        .resize(thumbnail(240, 240))
        .format('auto')
        .quality('auto')
        .toURL();
    }
    return '';
  }, [CloudinaryUtil, imageId]);

  return (
    <div
      className="flex flex-col items-stretch rounded-md border border-stone-400 bg-cover bg-center bg-repeat"
      style={{ backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined }}
    >
      <div className="flex flex-row items-center p-2">
        {isUploading ? <span className="text-lg">Uploading...</span> : null}
        <div className="grow" />
        {!isUploading ? (
          <PrimaryButton
            className="bg-white hover:bg-white/50"
            aria-label="Remove Image"
            onClick={() => handleRemove()}
            type="button"
          >
            <X className="text-red-400" />
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}
