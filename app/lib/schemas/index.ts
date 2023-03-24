import type { z } from "zod";
import { getFormData as ogGetFormData } from "remix-params-helper";
import { objectEntries } from "ts-extras";

type FormErrors<T extends z.ZodTypeAny> = {
  [K in keyof z.infer<T>]?: string[];
};

export async function getFormData<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<
  | { success: false; errors: FormErrors<T> }
  | { success: true; data: z.infer<T> }
> {
  let result = await ogGetFormData(request, schema);
  if (!result.success) {
    let errors = objectEntries(result.errors).reduce<FormErrors<T>>(
      (acc, [key, value]) => {
        let current = acc[key];
        if (current) {
          current.push(value);
          return acc;
        }

        return {
          ...acc,
          [key]: Array.isArray(value) ? value : [value],
        };
      },
      {}
    );

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
