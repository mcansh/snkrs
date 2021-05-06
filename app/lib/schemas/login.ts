import * as Yup from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().min(12).required(),
});

export type LoginSchema = Yup.InferType<typeof loginSchema>;

export { loginSchema };
