import * as Yup from 'yup';

const registerSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  name: Yup.string().required(),
  password: Yup.string().min(12).required(),
  repeat_password: Yup.ref('password'),
  username: Yup.string().min(5).required(),
});

export { registerSchema };
