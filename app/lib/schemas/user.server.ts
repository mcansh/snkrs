import { z } from "zod";
import { zfd } from "zod-form-data";

import reservedUsernames from "./reserved-usernames.json";
import commonPasswords from "./common-passwords.json";
import { timeZones } from "../timezones";

function isValidPassword(password: string): boolean {
  return !commonPasswords.includes(password.toLowerCase());
}

function isAllowedUsername(username: string): boolean {
  return !reservedUsernames.includes(username.toLowerCase());
}

export let registerSchema = zfd.formData({
  givenName: zfd.text(z.string().min(1, "Required")),
  familyName: zfd.text(z.string().min(1, "Required")),
  email: zfd.text(z.string().email()),
  password: zfd
    .text(z.string().min(12, "Must be at least 12 characters"))
    .refine(isValidPassword, { message: "Password is too common" }),
  username: zfd
    .text(z.string().min(1, "Required"))
    .refine(isAllowedUsername, { message: "Username is reserved" }),
});

export let loginSchema = zfd.formData({
  email: zfd.text(z.string().email()),
  password: zfd.text(z.string().min(12, "Must be at least 12 characters")),
});

export let editProfile = zfd.formData({
  email: zfd.text(z.string().email()),
  username: zfd
    .text(z.string())
    .refine(isAllowedUsername, { message: "Username is reserved" }),
  settings: z.object({
    showPurchasePrice: zfd.checkbox(),
    showRetailPrice: zfd.checkbox(),
    showTotalPrice: zfd.checkbox(),
    timezone: zfd.text(z.enum(timeZones).optional().default("UTC")),
  }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type EditProfileSchema = z.infer<typeof editProfile>;

export type PossibleRegistrationErrors = z.inferFlattenedErrors<
  typeof registerSchema
>["fieldErrors"];

export type PossibleLoginErrors = z.inferFlattenedErrors<
  typeof loginSchema
>["fieldErrors"];

export type PossibleEditProfileErrors = z.inferFlattenedErrors<
  typeof editProfile
>["fieldErrors"];
