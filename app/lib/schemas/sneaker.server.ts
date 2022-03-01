import * as Yup from 'yup';

import type { RemoveIndex } from '~/@types/types';

export let sneakerSchema = Yup.object().shape({
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

export type SneakerSchema = RemoveIndex<Yup.InferType<typeof sneakerSchema>>;
