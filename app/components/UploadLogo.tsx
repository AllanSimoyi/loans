import { useCallback, useState } from 'react';

import { useUploadImages } from '~/hooks/useUploadImages';
import { UploadState } from '~/models/imageUploading';

import { useField } from './ActionContextProvider';
import { InlineAlert } from './InlineAlert';
import { UploadImage } from './UploadImage';

interface Props {
  name: string;
  initialPublicId?: string | null;
}

export function UploadLogo(props: Props) {
  const { name, initialPublicId } = props;

  const [publicId, setPublicId] = useState(initialPublicId || '');
  const { uploadState, uploadError, uploadImages } = useUploadImages({
    initialUploadState: initialPublicId
      ? UploadState.Uploaded
      : UploadState.Idle,
  });

  const onChange = useCallback(
    async (files: File[]) => {
      if (files?.length) {
        const results = await uploadImages(files);
        if (results.length) {
          setPublicId(results[0].public_id);
        }
      }
    },
    [uploadImages, setPublicId],
  );

  const logoToolSet = {
    onChange,
    publicId,
    uploadState,
    uploadError,
  };

  const { error } = useField(name);

  return (
    <>
      <input type="hidden" name={name} value={publicId} readOnly />
      <UploadImage {...logoToolSet} identifier={'Logo'} />
      {Boolean(error) && <InlineAlert>{error}</InlineAlert>}
    </>
  );
}
