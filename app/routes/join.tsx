import * as React from 'react';
import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix';
import { redirect, Form, usePendingFormSubmit } from 'remix';
import { ValidationError } from 'yup';
import { parseBody } from 'remix-utils';

import { withSession } from '../lib/with-session';
import {
  flashMessageKey,
  redirectAfterAuthKey,
  sessionKey,
} from '../constants';
import { prisma } from '../db';
import { flashMessage } from '../flash-message';
import { EmailTakenJoinError, UsernameTakenJoinError } from '../errors';
import { registerSchema } from '../lib/schemas/join';
import { hash } from '../lib/auth';

const loader: LoaderFunction = ({ request }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user) {
        return redirect(`/${user.username}`);
      }

      session.flash(flashMessageKey, flashMessage('User not found', 'error'));
      session.unset(sessionKey);
    }

    return {};
  });

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    const body = await parseBody(request);
    const email = body.get('email') as string;
    const givenName = body.get('givenName') as string;
    const familyName = body.get('familyName') as string;
    const username = body.get('username') as string;
    const password = body.get('password') as string;

    const url = new URL(request.url);
    const redirectTo = url.searchParams.get(redirectAfterAuthKey);

    try {
      const valid = await registerSchema.validate({
        email,
        givenName,
        familyName,
        username,
        password,
      });

      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (foundUser && foundUser.email === email) {
        throw new EmailTakenJoinError();
      }

      if (foundUser && foundUser.username === username) {
        throw new UsernameTakenJoinError();
      }

      const hashed = await hash(valid.password);

      const newUser = await prisma.user.create({
        data: {
          email: valid.email,
          familyName: valid.familyName,
          givenName: valid.givenName,
          password: hashed,
          username: valid.username,
          fullName: `${valid.givenName} ${valid.familyName}`,
        },
      });

      session.set(sessionKey, newUser.id);

      return redirect(redirectTo ? redirectTo : `/${newUser.username}`);
    } catch (error) {
      console.error(error);
      if (error instanceof ValidationError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect(`/join`);
      }

      if (error instanceof UsernameTakenJoinError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect(`/join`);
      }

      if (error instanceof EmailTakenJoinError) {
        session.flash(flashMessageKey, flashMessage(error.message, 'error'));
        return redirect(`/join`);
      }

      session.flash(
        flashMessageKey,
        flashMessage('something went wrong', 'error')
      );

      return redirect(`/join`);
    }
  });

const meta: MetaFunction = () => ({
  title: 'Join Snkrs',
});

const JoinPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  return (
    <div className="w-11/12 max-w-lg py-8 mx-auto">
      <h1 className="pb-2 text-2xl font-medium">Join Snkrs</h1>
      <Form method="post" className="space-y-4">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <label htmlFor="givenName">
            <span>First Name:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="text"
              name="givenName"
              id="givenName"
              autoComplete="given-name"
            />
          </label>
          <label htmlFor="familyName">
            <span>Last Name:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="text"
              name="familyName"
              id="familyName"
              autoComplete="family-name"
            />
          </label>
          <label htmlFor="username">
            <span>Username:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="text"
              name="username"
              id="username"
              autoComplete="username"
            />
          </label>
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
            Join{pendingForm && 'ging...'}
          </button>
        </fieldset>
      </Form>
    </div>
  );
};

export default JoinPage;
export { action, loader, meta };
