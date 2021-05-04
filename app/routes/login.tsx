import * as React from 'react';
import {
  block,
  Form,
  usePendingFormSubmit,
  useRouteData,
  redirect,
} from 'remix';
import { useLocation } from 'react-router-dom';
import type { ActionFunction, LinksFunction, LoaderFunction } from 'remix';
import clsx from 'clsx';
import { parseBody } from 'remix-utils';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import { InvalidLoginError } from '../errors';
import { flashMessage } from '../flash-message';
import { verify } from '../lib/auth';
import { prisma } from '../db';
import { withSession } from '../lib/with-session';
import type { LoadingButtonProps } from '../components/loading-button';
import { LoadingButton } from '../components/loading-button';
import type { Flash } from '../@types/flash';
import { safeParse } from '../utils/safe-parse';
import checkIcon from '../icons/outline/check.svg';
import refreshIcon from '../icons/refresh-clockwise.svg';
import exclamationCircleIcon from '../icons/outline/exclamation-circle.svg';
import loginIcon from '../icons/outline/login.svg';

interface RouteData {
  loginError?: Flash;
}

const links: LinksFunction = () => [
  block({
    rel: 'preload',
    href: loginIcon,
    as: 'image',
    type: 'image/svg+xml',
  }),
];

const loader: LoaderFunction = ({ request }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);
    const loginError = session.get('loginError');

    const parsed = safeParse(loginError);

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (!user) {
        session.unset(sessionKey);
        return { loginError: parsed };
      }

      return redirect(`/${user.username}`);
    }
    return { loginError: parsed };
  });

const action: ActionFunction = ({ request }) =>
  withSession(request, async session => {
    const body = await parseBody(request);
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

      const valid = await verify(password, foundUser.password);

      if (!valid) {
        throw new InvalidLoginError();
      }

      session.set(sessionKey, foundUser.id);
      session.flash(
        flashMessageKey,
        flashMessage(`Welcome back ${foundUser.username}!`, 'success')
      );
      return redirect(redirectAfterLogin ? redirectAfterLogin : '/');
    } catch (error) {
      if (error instanceof InvalidLoginError) {
        session.flash('loginError', flashMessage(error.message, 'error'));
      } else {
        console.error(error);
      }

      return redirect(`/login`);
    }
  });

const meta = () => ({
  title: 'Log in',
});

const LoginPage: React.VFC = () => {
  const data = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();
  const location = useLocation();
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
      {data.loginError && (
        <div
          className={clsx(
            'px-4 py-2 mb-2 text-sm text-white rounded',
            typeof data.loginError === 'string'
              ? 'bg-purple-500'
              : data.loginError.type === 'error'
              ? 'bg-red-500'
              : 'bg-purple-500'
          )}
        >
          {typeof data.loginError === 'string'
            ? data.loginError
            : data.loginError.message}
        </div>
      )}

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

          <LoadingButton
            type="submit"
            state={state}
            text={<span>Log in</span>}
            textLoading={<span>Logging in</span>}
            textError={
              <span>There was an error logging in, please try again.</span>
            }
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
