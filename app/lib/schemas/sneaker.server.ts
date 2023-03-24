import accounting from "accounting";
import { isAfter } from "date-fns";
import { z } from "zod";

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

export let url_regex =
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;

export let sneakerSchema = z.object({
  model: z.string(),
  colorway: z.string(),
  brand: z.string(),
  size: z.number().positive(),
  imagePublicId: z.string(),
  retailPrice: z.preprocess(preprocessPrice, z.number()),
  price: z.preprocess(preprocessPrice, z.number()),
  purchaseDate: z
    .preprocess(preprocessDate, z.date())
    .superRefine(isReasonableDate),
});

export type SneakerSchema = z.infer<typeof sneakerSchema>;

export type PossibleErrors = z.inferFlattenedErrors<
  typeof sneakerSchema
>["fieldErrors"];
