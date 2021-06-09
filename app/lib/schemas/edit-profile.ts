import * as Yup from 'yup';
import reservedEmailAddressesList from 'reserved-email-addresses-list/index.json';
import reservedAdminList from 'reserved-email-addresses-list/admin-list.json';

const editProfile = Yup.object().shape({
  email: Yup.string().email().required(),
  username: Yup.string()
    .required()
    .notOneOf(
      [...reservedEmailAddressesList, ...reservedAdminList],
      'A user with this username already exists'
    ),
});

export type EditProfileSchema = Yup.InferType<typeof editProfile>;

export { editProfile };
