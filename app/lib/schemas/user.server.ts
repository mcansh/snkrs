import { z } from 'zod';

import { reservedUsernames } from './reserved-usernames.server';

export let registerSchema = z.object({
  email: z.string().email(),
  givenName: z.string(),
  familyName: z.string(),
  password: z.string().min(12),
  username: z
    .string()
    .refine(username => !reservedUsernames.includes(username), {
      message: 'Username is reserved',
    }),
});

export let loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;

export type PossibleRegistrationErrors = z.inferFlattenedErrors<
  typeof registerSchema
>['fieldErrors'];

export type PossibleLoginErrors = z.inferFlattenedErrors<
  typeof loginSchema
>['fieldErrors'];
