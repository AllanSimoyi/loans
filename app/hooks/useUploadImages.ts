import type { z } from 'zod';
import type { ImageUploadResponseSchema } from '~/models/imageUploading';

import { useCallback, useState } from 'react';

import { getErrorMessage } from '~/models/errors';
import { UploadState, handleImageUpload } from '~/models/imageUploading';

import { useCloudinary } from '../components/CloudinaryContextProvider';

interface Props {
  initialUploadState: UploadState;
}

export function useUploadImages(props: Props) {
  const { initialUploadState } = props;

  const [uploadState, setUploadState] =
    useState<UploadState>(initialUploadState);
  const [uploadError, setUploadError] = useState('');

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_RESET } = useCloudinary();

  const uploadImages = useCallback(
    async (files: File[]) => {
      try {
        setUploadState(UploadState.Uploading);
        const results = await Promise.all(
          files.map((file) =>
            handleImageUpload(
              file,
              CLOUDINARY_CLOUD_NAME,
              CLOUDINARY_UPLOAD_RESET,
            ),
          ),
        );
        const errors = results.filter((result) => result instanceof Error);
        if (errors.length) {
          throw errors[0];
        }
        setUploadState(UploadState.Uploaded);
        const successes = results.filter(
          (result): result is z.infer<typeof ImageUploadResponseSchema> => {
            return !(result instanceof Error);
          },
        );
        return successes;
      } catch (error) {
        setUploadError(getErrorMessage(error));
        setUploadState(UploadState.Error);
        return [];
      }
    },
    [CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_RESET],
  );

  return { uploadState, uploadError, uploadImages };
}
