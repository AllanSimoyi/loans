import type { Cloudinary } from '@cloudinary/url-gen';

import { useContext, createContext, useState } from 'react';

interface ContextProps {
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_UPLOAD_RESET: string;
  CloudinaryUtil: Cloudinary;
}

export const CloudinaryContext = createContext<ContextProps | undefined>(
  undefined,
);

interface Props extends ContextProps {
  children: React.ReactNode;
}

export function CloudinaryContextProvider(props: Props) {
  const { children, ...restOfProps } = props;
  const [state] = useState(restOfProps);

  return (
    <CloudinaryContext.Provider value={state}>
      {children}
    </CloudinaryContext.Provider>
  );
}

export function useCloudinary() {
  const context = useContext(CloudinaryContext);
  if (!context) {
    throw new Error(
      `useCloudinary must be used within a CloudinaryContextProvider`,
    );
  }
  return context;
}
