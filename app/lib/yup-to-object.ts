import type { ValidationError } from 'yup';

function yupToObject<Schema>(errors: ValidationError): {
  [key in keyof Schema]?: string;
} {
  if (errors.inner.length === 0) return {};
  return errors.inner.reduce<{ [key in keyof Schema]?: string }>(
    (validationErrors, error) => {
      if (!error.path) return validationErrors;

      return {
        ...validationErrors,
        [error.path]: error.message,
      };
    },
    {}
  );
}

export { yupToObject };
