import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { User } from "@prisma/client";
import { createTypedSessionStorage } from "remix-utils";
import { z } from "zod";

import { prisma } from "./db.server";
import { env } from "./env.server";

let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [env.SESSION_PASSWORD],
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: true,
    path: "/",
    secure: env.NODE_ENV === "production",
  },
});

let sessionSchema = z.object({
  userId: z.string().optional(),
  timeZone: z.string().optional(),
});

let typedSessionStorage = createTypedSessionStorage({
  sessionStorage,
  schema: sessionSchema,
});

export { typedSessionStorage as sessionStorage };

export function getSession(request: Request) {
  return typedSessionStorage.getSession(request.headers.get("Cookie"));
}

let USER_SESSION_KEY = "userId" as const;

export async function getUserId(
  request: Request,
): Promise<string | undefined | null> {
  let session = await getSession(request);
  return session.get(USER_SESSION_KEY);
}

export async function getUser(request: Request): Promise<User | undefined> {
  let userId = await getUserId(request);
  if (!userId) return undefined;
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return undefined;
  return user;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = request.url,
): Promise<string> {
  let userId = await getUserId(request);
  if (!userId) {
    let searchParams = new URLSearchParams();
    searchParams.set("redirectTo", redirectTo);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return userId;
}

export async function requireUser(
  request: Request,
  redirectTo: string = request.url,
): Promise<User> {
  let userId = await requireUserId(request, redirectTo);
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    let searchParams = new URLSearchParams();
    searchParams.set("redirectTo", redirectTo);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return user;
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo: string,
) {
  let session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await typedSessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  let session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await typedSessionStorage.destroySession(session),
    },
  });
}

export async function getTimeZone(request: Request) {
  let session = await getSession(request);
  return session.get("timeZone") || "UTC";
}

export let commitSession = typedSessionStorage.commitSession;
