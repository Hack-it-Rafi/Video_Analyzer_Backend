import { z } from 'zod';

const addVIDEOSchema = z.object({
  body: z.object({ 
    caption: z.string().optional(),
  }),
});

export const VIDEOValidation = {
  addVIDEOSchema,
};