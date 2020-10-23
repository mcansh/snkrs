import * as Yup from 'yup';

const createSneakerSchema = Yup.object().shape({
  model: Yup.string().required(),
  colorway: Yup.string().required(),
  brand: Yup.string().required(),
  size: Yup.number().positive().notRequired(),
  imagePublicId: Yup.string().required(),
  price: Yup.number().positive().integer().required(),
  purchaseDate: Yup.date().notRequired().max(new Date()),
  sold: Yup.boolean().notRequired().default(false),
  soldDate: Yup.date().notRequired().max(new Date()),
  soldPrice: Yup.number().positive().notRequired(),
});

export { createSneakerSchema };
