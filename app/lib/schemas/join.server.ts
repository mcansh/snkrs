import * as Yup from 'yup';

import { reservedUsernames } from './reserved-usernames.server';

import type { RemoveIndex } from '~/@types/types';

const registerSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  givenName: Yup.string().required(),
  familyName: Yup.string().required(),
  password: Yup.string().min(12).required(),
  username: Yup.string()
    .required()
    .notOneOf(reservedUsernames, 'A user with this username already exists'),
});

export type RegisterSchema = RemoveIndex<Yup.InferType<typeof registerSchema>>;

export { registerSchema };
