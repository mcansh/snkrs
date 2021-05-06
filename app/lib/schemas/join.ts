import * as Yup from 'yup';
import reservedEmailAddressesList from 'reserved-email-addresses-list/index.json';
import reservedAdminList from 'reserved-email-addresses-list/admin-list.json';

const registerSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  givenName: Yup.string().required(),
  familyName: Yup.string().required(),
  password: Yup.string().min(12).required(),
  username: Yup.string()
    .required()
    .notOneOf(
      [...reservedEmailAddressesList, ...reservedAdminList],
      'A user with this username already exists'
    ),
});

export type RegisterSchema = Yup.InferType<typeof registerSchema>;

export { registerSchema };
