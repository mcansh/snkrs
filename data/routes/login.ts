import type { Action } from '@remix-run/data';
import { redirect, parseFormBody } from '@remix-run/data';
import { verify } from 'argon2';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { InvalidLoginError } from '../errors';
import { flashMessage } from '../flash-message';

const action: Action = async ({ session, request, context }) => {
  const { prisma } = context as Context;
  const body = await parseFormBody(request);
  const email = body.get('email') as string;
  const password = body.get('password') as string;

  const redirectAfterLogin = session.get(redirectKey);

  try {
    const foundUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!foundUser) {
      throw new InvalidLoginError();
    }

    const valid = await verify(foundUser.password, password);

    if (!valid) {
      throw new InvalidLoginError();
    }

    session.set(sessionKey, foundUser.id);
    session.flash(
      flashMessageKey,
      flashMessage(`Welcome back ${foundUser.username}!`, 'success')
    );
    session.unset(redirectKey);
    return redirect(redirectAfterLogin ? redirectAfterLogin : '/');
  } catch (error) {
    if (error instanceof InvalidLoginError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
    }
    return redirect(`/login`);
  }
};

export { action };
