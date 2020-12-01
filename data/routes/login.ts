import type { Action } from '@remix-run/data';
import { redirect, parseFormBody } from '@remix-run/data';
import { verify } from 'argon2';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { flashMessage } from '../flash-message';

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as Context;
  const body = await parseFormBody(request);
  const email = body.get('email') as string;
  const password = body.get('password') as string;

  const redirectAfterLogin = session.get(redirectKey);

  const foundUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!foundUser) {
    session.flash(
      flashMessageKey,
      flashMessage('Invalid Username/Password combo', 'error')
    );
    return redirect(`/login`);
  }

  const valid = await verify(foundUser.password, password);

  if (!valid) {
    session.flash(
      flashMessageKey,
      flashMessage('Invalid Username/Password combo', 'error')
    );

    return redirect(`/login`);
  }

  session.set(sessionKey, foundUser.id);
  session.flash(
    flashMessageKey,
    flashMessage(`Welcome back ${foundUser.username}!`, 'success')
  );
  session.unset(redirectKey);
  return redirect(redirectAfterLogin ? redirectAfterLogin : '/');
};

export { action };
