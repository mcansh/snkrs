import type { Session } from 'remix';
import { createCookieSessionStorage, redirect } from 'remix';
import type { User } from '@prisma/client';

import { prisma } from './db.server';

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secrets: [process.env.SESSION_PASSWORD],
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
});

export function getSession(request: Request): Promise<Session> {
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

let USER_SESSION_KEY = 'userId';

export async function getUserId(request: Request): Promise<string | undefined> {
  let session = await getSession(request);
  return session.get(USER_SESSION_KEY);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = request.url
): Promise<string> {
  let userId = await getUserId(request);
  if (!userId) {
    let searchParams = new URLSearchParams();
    searchParams.set('redirectTo', redirectTo);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return userId;
}

export async function requireUser(
  request: Request,
  redirectTo: string = request.url
): Promise<User> {
  let userId = await requireUserId(request, redirectTo);
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    let searchParams = new URLSearchParams();
    searchParams.set('redirectTo', redirectTo);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return user;
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo: string
): Promise<Response> {
  let session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request): Promise<Response> {
  let session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
