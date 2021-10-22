import * as Yup from 'yup';

import type { RemoveIndex } from '../../@types/types';

import { reservedUsernames } from './reserved-usernames.server';

const editProfile = Yup.object().shape({
  email: Yup.string().email().required(),
  username: Yup.string()
    .required()
    .notOneOf(reservedUsernames, 'A user with this username already exists'),
});

export type EditProfileSchema = RemoveIndex<Yup.InferType<typeof editProfile>>;

export { editProfile };
