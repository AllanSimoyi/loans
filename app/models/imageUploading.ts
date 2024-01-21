import { z } from 'zod';

import { getErrorMessage } from './errors';

export enum UploadState {
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Error = 'error',
  Idle = 'idle',
}

export const ImageUploadResponseSchema = z.object({
  public_id: z.string(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
});
export async function handleImageUpload(
  file: File,
  CLOUD_NAME: string,
  UPLOAD_RESET: string,
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_RESET);
    formData.append('tags', 'rte');
    formData.append('context', '');

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

    const response = await fetch(url, { method: 'POST', body: formData }).then(
      (response) => response.json(),
    );
    const result = ImageUploadResponseSchema.safeParse(response);
    if (!result.success) {
      throw new Error('Received invalid output whilst uploading image');
    }
    return result.data;
  } catch (error) {
    return new Error(getErrorMessage(error));
  }
}
