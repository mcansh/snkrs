import { z } from "zod";

let envSchema = z.object({
  DATABASE_URL: z.string(),
  FATHOM_SITE_ID: z.string(),
  FATHOM_SCRIPT_URL: z.string(),
  SESSION_PASSWORD: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DEFAULT_USER: z.string(),
});

export let env = envSchema.parse(process.env);
