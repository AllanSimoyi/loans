import { useCallback, useState } from 'react';

import { UploadState } from '~/models/imageUploading';

import { useUploadImages } from './useUploadImages';

interface Props {
  initialPublicId: string;
}

export interface UploadKycDocToolSet {
  onChange: (files: File[]) => Promise<void>;
  publicId: string;
  uploadState: UploadState;
  uploadError: string;
}

export function useUploadKycDoc(props: Props): UploadKycDocToolSet {
  const { initialPublicId } = props;

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

  return { onChange, publicId, uploadState, uploadError };
}
