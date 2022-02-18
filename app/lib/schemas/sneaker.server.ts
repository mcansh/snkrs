import * as Yup from 'yup';

import type { RemoveIndex } from '~/@types/types';

export const sneakerSchema = Yup.object().shape({
  model: Yup.string().required(),
  colorway: Yup.string().required(),
  brand: Yup.string().required(),
  size: Yup.number().positive().required(),
  imagePublicId: Yup.string().required(),
  retailPrice: Yup.number().required().positive(),
  price: Yup.number().positive().integer().required(),
  purchaseDate: Yup.date().required().max(new Date()),
  sold: Yup.boolean().notRequired().default(false),
  soldDate: Yup.date().notRequired().max(new Date()).when('sold', {
    is: true,
    then: Yup.date().required(),
  }),
  soldPrice: Yup.number().notRequired().positive().when('sold', {
    is: true,
    then: Yup.number().required().positive(),
  }),
});

export type SneakerSchema = RemoveIndex<Yup.InferType<typeof sneakerSchema>>;
