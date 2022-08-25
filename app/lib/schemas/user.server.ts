import { z } from 'zod';

import reservedUsernames from './reserved-usernames.json';
import commonPasswords from './common-passwords.json';

function isValidPassword(password: string): boolean {
  return !commonPasswords.includes(password.toLowerCase());
}

function isAllowedUsername(username: string): boolean {
  return !reservedUsernames.includes(username.toLowerCase());
}

export let registerSchema = z.object({
  givenName: z.string().min(1, 'Required'),
  familyName: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Must be at least 12 characters')
    .refine(isValidPassword, { message: 'Password is too common' }),
  username: z
    .string()
    .min(1, 'Required')
    .refine(isAllowedUsername, { message: 'Username is reserved' }),
});

export let loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Must be at least 12 characters'),
});

export let editProfile = z.object({
  email: z.string().email(),
  username: z
    .string()
    .refine(isAllowedUsername, { message: 'Username is reserved' }),
  settings: z.object({
    showPurchasePrice: z.boolean().optional(),
    showRetailPrice: z.boolean().optional(),
    showTotalPrice: z.boolean().optional(),
  }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type EditProfileSchema = z.infer<typeof editProfile>;

export type PossibleRegistrationErrors = z.inferFlattenedErrors<
  typeof registerSchema
>['fieldErrors'];

export type PossibleLoginErrors = z.inferFlattenedErrors<
  typeof loginSchema
>['fieldErrors'];

export type PossibleEditProfileErrors = z.inferFlattenedErrors<
  typeof editProfile
>['fieldErrors'];
