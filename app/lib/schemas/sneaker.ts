import * as Yup from 'yup';

const sneakerSchema = Yup.object().shape({
  model: Yup.string().required(),
  colorway: Yup.string().required(),
  brand: Yup.string().required(),
  size: Yup.number().positive().required(),
  imagePublicId: Yup.string().required(),
  retailPrice: Yup.number().required().positive(),
  price: Yup.number().positive().integer().required(),
  purchaseDate: Yup.date().required().max(new Date()),
  sold: Yup.boolean().notRequired().default(false),
  soldDate: Yup.date().notRequired().max(new Date()),
  soldPrice: Yup.number().notRequired().positive(),
});

type SneakerSchema = Yup.InferType<typeof sneakerSchema>;

export { sneakerSchema, SneakerSchema };
