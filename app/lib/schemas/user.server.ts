import * as Yup from 'yup';
import type { User } from '@prisma/client';

import { reservedUsernames } from './reserved-usernames.server';

import type { RemoveIndex } from '~/@types/types';

export const registerSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  givenName: Yup.string().required(),
  familyName: Yup.string().required(),
  password: Yup.string().min(12).required(),
  username: Yup.string()
    .required()
    .notOneOf(reservedUsernames, 'A user with this username already exists'),
});

export const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().min(12).required(),
});

export type LoginSchema = RemoveIndex<Yup.InferType<typeof loginSchema>>;
export type RegisterSchema = RemoveIndex<Yup.InferType<typeof registerSchema>>;

export function isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}
