import { z } from 'zod';

import { PresentStringSchema } from './core.validations';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  SESSION_SECRET: PresentStringSchema,
  CLOUDINARY_API_KEY: PresentStringSchema,
  CLOUDINARY_API_SECRET: PresentStringSchema,
  CLOUDINARY_CLOUD_NAME: PresentStringSchema,
  CLOUDINARY_UPLOAD_RESET: PresentStringSchema,
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error('Environment variables are invalid:', result.error.flatten());
  process.exit(1);
}
export const Env = result.data;
