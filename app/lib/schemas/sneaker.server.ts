import { isBefore } from 'date-fns';
import { z } from 'zod';

export let sneakerSchema = z
  .object({
    model: z.string(),
    colorway: z.string(),
    brand: z.string(),
    size: z.number().positive(),
    imagePublicId: z.string(),
    retailPrice: z.number().positive(),
    price: z.number().positive(),
    purchaseDate: z
      .preprocess(date => {
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
      }, z.date())
      .refine(date => {
        return isBefore(date, new Date());
      }),
    sold: z.boolean().optional().default(false),
    soldDate: z
      .preprocess(date => {
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
      }, z.date())
      .optional(),
    soldPrice: z.number().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sold) {
      if (!data.soldDate) {
        ctx.addIssue({
          path: ['soldDate'],
          message: 'Sold date is required if the sneaker is sold',
          code: z.ZodIssueCode.custom,
        });
      }

      if (!data.soldPrice) {
        ctx.addIssue({
          path: ['soldPrice'],
          message: 'Sold price is required if the sneaker is sold',
          code: z.ZodIssueCode.custom,
        });
      }

      return ctx;
    }
  });

export type SneakerSchema = z.infer<typeof sneakerSchema>;

export type PossibleErrors = z.inferFlattenedErrors<
  typeof sneakerSchema
>['fieldErrors'];
