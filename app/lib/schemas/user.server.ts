import { z } from 'zod';

import { reservedUsernames } from './reserved-usernames.server';

export let registerSchema = z.object({
  givenName: z.string().min(1, 'Required'),
  familyName: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z.string().min(12, 'Must be at least 12 characters'),
  username: z
    .string()
    .min(1, 'Required')
    .refine(username => !reservedUsernames.includes(username), {
      message: 'Username is reserved',
    }),
});

export let loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Must be at least 12 characters'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;

export type PossibleRegistrationErrors = z.inferFlattenedErrors<
  typeof registerSchema
>['fieldErrors'];

export type PossibleLoginErrors = z.inferFlattenedErrors<
  typeof loginSchema
>['fieldErrors'];
