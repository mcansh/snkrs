import type { ValidationError } from 'yup';

function yupToObject<Schema>(errors: ValidationError) {
  if (errors.inner.length === 0) return {};
  return errors.inner.reduce<Partial<Schema>>((validationErrors, error) => {
    if (!error.path) return validationErrors;

    return {
      ...validationErrors,
      [error.path]: error.message,
    };
  }, {});
}

export { yupToObject };
