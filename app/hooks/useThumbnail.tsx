import { thumbnail } from '@cloudinary/url-gen/actions/resize';
import { useMemo } from 'react';

import { useCloudinary } from '~/components/CloudinaryContextProvider';

export function useThumbnail(imageId: string | undefined) {
  const { CloudinaryUtil } = useCloudinary();

  return useMemo(() => {
    if (!imageId) {
      return undefined;
    }
    return CloudinaryUtil.image(imageId)
      .resize(thumbnail().width(250).height(250))
      .format('auto')
      .quality('auto')
      .toURL();
  }, [CloudinaryUtil, imageId]);
}
