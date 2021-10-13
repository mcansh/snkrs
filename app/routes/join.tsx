import * as React from 'react';
import { Form, redirect, useTransition, useLoaderData } from 'remix';
import { ValidationError } from 'yup';
import { json, parseBody } from 'remix-utils';

import { withSession } from '../lib/with-session';
import {
  flashMessageKey,
  redirectAfterAuthKey,
  sessionKey,
} from '../constants';
import { prisma } from '../db.server';
import { flashMessage } from '../flash-message';
import { EmailTakenJoinError, UsernameTakenJoinError } from '../errors';
import { registerSchema } from '../lib/schemas/join';
import { hash } from '../lib/auth';
import checkIcon from '../icons/outline/check.svg';
import refreshIcon from '../icons/refresh-clockwise.svg';
import exclamationCircleIcon from '../icons/outline/exclamation-circle.svg';
import loginIcon from '../icons/outline/login.svg';
import { LoadingButton } from '../components/loading-button';
import { yupToObject } from '../lib/yup-to-object';
import type { LoadingButtonProps } from '../components/loading-button';
import type { RegisterSchema } from '../lib/schemas/join';
import type {
  TypedActionFunction,
  TypedLinksFunction,
  TypedLoaderFunction,
  TypedMetaFunction,
} from '../@types';

const links: TypedLinksFunction = () => [
  {
    href: LoadingButton.styles,
    rel: 'stylesheet',
  },
];

interface RouteData {
  joinError?: undefined | (Partial<RegisterSchema> & { generic?: string });
}

const loader: TypedLoaderFunction = ({ request }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (user) {
        return redirect(`/${user.username}`);
      }

      session.flash(flashMessageKey, flashMessage('User not found', 'error'));
      session.unset(sessionKey);
    }

    return json({});
  });

const action: TypedActionFunction = ({ request }) =>
  withSession(request, async session => {
    const body = await parseBody(request);
    const email = body.get('email');
    const givenName = body.get('givenName');
    const familyName = body.get('familyName');
    const username = body.get('username');
    const password = body.get('password');

    const url = new URL(request.url);
    const redirectTo = url.searchParams.get(redirectAfterAuthKey);

    try {
      const valid = await registerSchema.validate(
        {
          email,
          givenName,
          familyName,
          username,
          password,
        },
        { abortEarly: false }
      );

      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: valid.email }, { username: valid.username }],
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
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof ValidationError) {
        const aggregateErrors = yupToObject<RegisterSchema>(error);
        session.flash('joinError', aggregateErrors);
        return redirect(request.url);
      }

      if (
        error instanceof UsernameTakenJoinError ||
        error instanceof EmailTakenJoinError
      ) {
        session.flash('joinError', { generic: error.message });
        return redirect(request.url);
      }

      session.flash(
        'joinError',
        JSON.stringify({ generic: 'something went wrong' })
      );

      return redirect(request.url);
    }
  });

const meta: TypedMetaFunction = () => ({
  title: 'Join Snkrs',
  description: 'show off your sneaker collection',
});

const JoinPage: React.VFC = () => {
  const transition = useTransition();
  const pendingForm = transition.submission;
  const data = useLoaderData<RouteData>();

  const [state, setState] = React.useState<LoadingButtonProps['state']>('idle');
  const timerRef = React.useRef<NodeJS.Timeout>();

  const colors = {
    idle: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-700',
      ring: 'focus:bg-blue-700',
      disabled: 'focus:bg-blue-200',
    },
    loading: {
      bg: 'bg-indigo-500',
      hover: 'hover:bg-indigo-700',
      ring: 'focus:ring-indigo-700',
      disabled: 'focus:ring-indigo-200',
    },
    error: {
      bg: 'bg-red-500',
      hover: 'hover:bg-red-700',
      ring: 'focus:ring-red-700',
      disabled: 'focus:ring-red-200',
    },
    success: {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-700',
      ring: 'focus:ring-green-700',
      disabled: 'focus:ring-green-200',
    },
  };

  React.useEffect(() => {
    if (pendingForm) {
      setState('loading');
    } else if (data.joinError) {
      setState('error');
      timerRef.current = setTimeout(() => {
        setState('idle');
      }, 1500);
    } else {
      setState('idle');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data.joinError, pendingForm]);

  return (
    <div className="w-11/12 max-w-lg py-8 mx-auto">
      {data.joinError?.generic && (
        <div className="px-4 py-2 mb-2 text-sm text-white bg-red-500 rounded">
          {data.joinError.generic}
        </div>
      )}

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
          {data.joinError?.givenName && <p>{data.joinError.givenName}</p>}
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
          {data.joinError?.familyName && <p>{data.joinError.familyName}</p>}
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
          {data.joinError?.username && <p>{data.joinError.username}</p>}
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
          {data.joinError?.email && <p>{data.joinError.email}</p>}
          <label htmlFor="password">
            <span>Password:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="password"
              name="password"
              id="password"
            />
          </label>
          {data.joinError?.password && <p>{data.joinError.password}</p>}
          <LoadingButton
            type="submit"
            state={state}
            text={<span>Join</span>}
            textLoading={<span>Joining</span>}
            ariaText="Log in"
            ariaLoadingAlert="Attempting to register"
            ariaSuccessAlert="Successfully registered, redirecting..."
            ariaErrorAlert="Error registering"
            icon={
              <svg className="w-6 h-6">
                <use href={`${loginIcon}#login`} />
              </svg>
            }
            iconError={
              <svg className="w-6 h-6">
                <use href={`${exclamationCircleIcon}#exclamation-circle`} />
              </svg>
            }
            iconLoading={
              <svg className="w-6 h-6 animate-spin">
                <use href={`${refreshIcon}#refresh-clockwise`} />
              </svg>
            }
            iconSuccess={
              <svg className="w-6 h-6">
                <use href={`${checkIcon}#check`} />
              </svg>
            }
            className={`px-4 py-2 disabled:cursor-not-allowed border border-transparent shadow-sm text-base font-medium rounded text-white ${colors[state].bg} ${colors[state].hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[state].ring}`}
          />
        </fieldset>
      </Form>
    </div>
  );
};

export default JoinPage;
export { action, links, loader, meta };
