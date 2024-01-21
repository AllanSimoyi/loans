import type { ChangeEvent } from 'react';

import { useCallback } from 'react';
import { twMerge } from 'tailwind-merge';

import { UploadState } from '~/models/imageUploading';

import { useIsSubmitting } from './ActionContextProvider';
import { ImageUploadIcon } from './ImageUploadIcon';

interface Props {
  onChange: (files: File[]) => void;
  uploadState: UploadState;
  uploadError: string;
  publicId: string;
  identifier: string;
}

export function UploadImage(props: Props) {
  const { onChange, uploadState, uploadError, publicId, identifier } = props;
  const isProcessing = useIsSubmitting();
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        onChange([event.target.files[0]!]);
      }
    },
    [onChange],
  );
  return (
    <>
      <label htmlFor={`file${identifier}`}>
        <div className="flex cursor-pointer flex-row items-stretch justify-start gap-12 rounded-md border border-stone-200 p-4 hover:bg-stone-100">
          <div className="flex flex-col items-start justify-start">
            <span className="text-stone-600">Click To Upload {identifier}</span>
            <span className="text-xs font-light text-stone-600">
              The file should be less that 5MB
            </span>
            {uploadError && <span className="text-red-600">{uploadError}</span>}
          </div>
          <div className="grow" />
          <div className="flex flex-col items-center justify-center">
            <ImageUploadIcon
              status={uploadState}
              publicId={publicId}
              className={twMerge(
                'cursor-pointer text-stone-600',
                uploadState === UploadState.Uploaded && 'text-green-600',
                uploadState === UploadState.Uploading && 'text-blue-600',
                uploadState === UploadState.Error && 'text-red-600',
              )}
            />
          </div>
        </div>
      </label>
      <input
        disabled={isProcessing}
        onChange={handleChange}
        id={`file${identifier}`}
        accept="image/*"
        type="file"
        className="invisible absolute left-0 top-0 opacity-0"
      />
    </>
  );
}
