import * as React from 'react';
import { Form, redirect, useTransition, useLoaderData, json } from 'remix';
import { ValidationError } from 'yup';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LinksFunction, LoaderFunction } from 'remix';

import { flashMessageKey, redirectAfterAuthKey, sessionKey } from '~/constants';
import { InvalidLoginError } from '~/errors';
import { flashMessage } from '~/flash-message';
import { verify } from '~/lib/auth';
import { prisma } from '~/db.server';
import { withSession } from '~/lib/with-session';
import { LoadingButton } from '~/components/loading-button';
import checkIcon from '~/icons/outline/check.svg';
import refreshIcon from '~/icons/refresh-clockwise.svg';
import exclamationCircleIcon from '~/icons/outline/exclamation-circle.svg';
import loginIcon from '~/icons/outline/login.svg';
import { yupToObject } from '~/lib/yup-to-object';
import { loginSchema } from '~/lib/schemas/user.server';
import type { LoginSchema } from '~/lib/schemas/user.server';
import type { LoadingButtonProps } from '~/components/loading-button';
import { commitSession, getSession } from '~/session';

interface RouteData {
  loginError: undefined | (Partial<LoginSchema> & { generic?: string });
}

const links: LinksFunction = () => [
  {
    href: LoadingButton.styles,
    rel: 'stylesheet',
  },
];

const loader: LoaderFunction = ({ request }) =>
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

    const loginError = session.get('loginError') as RouteData['loginError'];

    const data: RouteData = { loginError };

    return json(data);
  });

const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const requestBody = await request.text();
  const body = new URLSearchParams(requestBody);
  const email = body.get('email');
  const password = body.get('password');

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get(redirectAfterAuthKey);

  try {
    const valid = await loginSchema.validate(
      { email, password },
      { abortEarly: false }
    );

    const foundUser = await prisma.user.findUnique({
      where: { email: valid.email },
    });

    if (!foundUser) {
      throw new InvalidLoginError();
    }

    const validCredentials = await verify(valid.password, foundUser.password);

    if (!validCredentials) {
      throw new InvalidLoginError();
    }

    session.set(sessionKey, foundUser.id);
    session.flash(
      flashMessageKey,
      flashMessage(`Welcome back ${foundUser.username}!`, 'success')
    );
    return redirect(redirectTo ?? '/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ValidationError) {
      const aggregateErrors = yupToObject<LoginSchema>(error);
      session.flash('loginError', aggregateErrors);
      return redirect(request.url, {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    if (error instanceof InvalidLoginError) {
      session.flash('loginError', { generic: error.message });
      return redirect(request.url, {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      });
    }

    session.flash('loginError', { generic: 'something went wrong' });
    return redirect(request.url, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const meta: MetaFunction = () => ({
  title: 'Log in',
  description: 'show off your sneaker collection',
});

const LoginPage: React.VFC = () => {
  const data = useLoaderData<RouteData>();
  const transition = useTransition();
  const pendingForm = transition.submission;
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
    } else if (data.loginError) {
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
  }, [data.loginError, pendingForm]);

  return (
    <div className="w-11/12 max-w-lg py-8 mx-auto">
      {data.loginError?.generic && (
        <div className="px-4 py-2 mb-2 text-sm text-white bg-red-500 rounded">
          {data.loginError.generic}
        </div>
      )}

      <h1 className="pb-2 text-2xl font-medium">Log in</h1>

      <Form method="post" className="space-y-4">
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <label htmlFor="email">
            <span>Email:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              autoFocus
            />
          </label>
          {data.loginError?.email && (
            <p className="text-sm text-red-500">{data.loginError.email}</p>
          )}
          <label htmlFor="password">
            <span>Password:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="password"
              name="password"
              id="password"
            />
          </label>
          {data.loginError?.password && (
            <p className="text-sm text-red-500">{data.loginError.password}</p>
          )}

          <LoadingButton
            disabled={!!pendingForm}
            type="submit"
            state={state}
            text={<span>Log in</span>}
            textLoading={<span>Logging in</span>}
            ariaText="Log in"
            ariaLoadingAlert="Attempting to log in"
            ariaSuccessAlert="Successfully logged in, redirecting..."
            ariaErrorAlert="Error logging in"
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

export default LoginPage;
export { action, links, loader, meta };
