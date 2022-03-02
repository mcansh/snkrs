import { z } from 'zod';

import { reservedUsernames } from './reserved-usernames.server';

export let editProfile = z.object({
  email: z.string().email(),
  username: z
    .string()
    .refine(username => !reservedUsernames.includes(username), {
      message: 'Username is reserved',
    }),
  settings: z.object({
    showPurchasePrice: z.boolean().optional(),
    showRetailPrice: z.boolean().optional(),
    showTotalPrice: z.boolean().optional(),
  }),
});

export type EditProfileSchema = z.infer<typeof editProfile>;

export type PossibleEditProfileErrors = z.inferFlattenedErrors<
  typeof editProfile
>['fieldErrors'];
