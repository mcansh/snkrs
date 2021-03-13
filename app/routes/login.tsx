import * as React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';
import { useLocation } from 'react-router-dom';
import type { Action } from '@remix-run/data';
import { redirect } from '@remix-run/data';
import { verify } from 'argon2';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { InvalidLoginError } from '../errors';
import { flashMessage } from '../flash-message';
import { commitSession, getSession } from '../session';

const action: Action = async ({ request, context }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const { prisma } = context as Context;
  const reqBody = await request.text();
  const body = new URLSearchParams(reqBody);
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
    return redirect(redirectAfterLogin ? redirectAfterLogin : '/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    if (error instanceof InvalidLoginError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
    }
    return redirect(`/login`, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const meta = () => ({
  title: 'Log in',
});

const Login: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const location = useLocation();

  return (
    <div className="w-11/12 max-w-lg py-8 mx-auto">
      <h1 className="pb-2 text-2xl font-medium">Log in</h1>

      <Form
        action={`/login?${location.search}`}
        method="post"
        className="space-y-4"
      >
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <label htmlFor="email">
            <span>Email:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="email"
              name="email"
              id="email"
              autoComplete="email"
            />
          </label>
          <label htmlFor="password">
            <span>Password:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="password"
              name="password"
              id="password"
            />
          </label>
          <button
            className="self-start w-auto px-4 py-2 text-left text-white transition-colors duration-100 ease-in-out bg-blue-500 rounded disabled:bg-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed"
            type="submit"
          >
            Log{pendingForm && 'ging'} in
          </button>
        </fieldset>
      </Form>
    </div>
  );
};

export default Login;
export { meta, action };
