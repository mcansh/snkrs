import * as Yup from 'yup';

import { reservedUsernames } from './reserved-usernames.server';

import type { RemoveIndex } from '~/@types/types';

const editProfile = Yup.object().shape({
  email: Yup.string().email().required(),
  username: Yup.string()
    .required()
    .notOneOf(reservedUsernames, 'A user with this username already exists'),
  settings: Yup.object({
    showPurchasePrice: Yup.boolean().optional(),
    showRetailPrice: Yup.bool().optional(),
    showTotalPrice: Yup.bool().optional(),
  }),
});

export type EditProfileSchema = RemoveIndex<Yup.InferType<typeof editProfile>>;

export { editProfile };
