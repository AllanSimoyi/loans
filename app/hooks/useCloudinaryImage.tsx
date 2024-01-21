import { byRadius } from '@cloudinary/url-gen/actions/roundCorners';
import { useMemo } from 'react';

import { useCloudinary } from '~/components/CloudinaryContextProvider';

export function useCloudinaryImage(imageId: string | undefined) {
  const { CloudinaryUtil } = useCloudinary();

  return useMemo(() => {
    if (!imageId) {
      return undefined;
    }
    return CloudinaryUtil.image(imageId)
      .roundCorners(byRadius(5))
      .format('auto')
      .quality('auto')
      .toURL();
  }, [CloudinaryUtil, imageId]);
}
