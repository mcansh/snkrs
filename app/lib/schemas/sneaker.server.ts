import accounting from "accounting";
import { isAfter } from "date-fns";
import { z } from "zod";
import { zfd } from "zod-form-data";

const preprocessDate: z.PreprocessEffect<unknown>["transform"] = (data) => {
  if (typeof data !== "string") return data;
  return new Date(data);
};

const isReasonableDate: z.RefinementEffect<Date>["refinement"] = (
  date,
  ctx
) => {
  if (isAfter(date, new Date())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date cannot be in the future",
    });
  }
};

const preprocessPrice: z.PreprocessEffect<unknown>["transform"] = (data) => {
  if (typeof data !== "string") return data;
  return accounting.unformat(data) * 100;
};

export let sneakerSchema = zfd.formData({
  model: zfd.text(),
  colorway: zfd.text(),
  brand: zfd.text(),
  size: zfd.numeric(z.number().positive()),
  imagePublicId: zfd.text(),
  retailPrice: z.preprocess(preprocessPrice, z.number()),
  price: z.preprocess(preprocessPrice, z.number()),
  purchaseDate: zfd
    .text(z.preprocess(preprocessDate, z.date()))
    .superRefine(isReasonableDate),
});

export type SneakerSchema = z.infer<typeof sneakerSchema>;

export type PossibleErrors = z.inferFlattenedErrors<
  typeof sneakerSchema
>["fieldErrors"];
