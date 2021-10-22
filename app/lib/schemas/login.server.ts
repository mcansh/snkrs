import * as Yup from 'yup';

import type { RemoveIndex } from '../../@types/types';

const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().min(12).required(),
});

export type LoginSchema = RemoveIndex<Yup.InferType<typeof loginSchema>>;

export { loginSchema };
