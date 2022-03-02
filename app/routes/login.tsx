import {
  redirect,
  useTransition,
  useLoaderData,
  json,
  useActionData,
  Form,
} from 'remix';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LoaderFunction } from 'remix';
import Alert from '@reach/alert';

import { verify } from '~/lib/auth.server';
import { prisma } from '~/db.server';
import { loginSchema } from '~/lib/schemas/user.server';
import type {
  LoginSchema,
  PossibleLoginErrors,
} from '~/lib/schemas/user.server';
import {
  createUserSession,
  getSession,
  getUserId,
  sessionStorage,
} from '~/session.server';
import { getSeoMeta } from '~/seo';
import type { RouteHandle } from '~/@types/types';

interface RouteData {
  loginError: undefined | (Partial<LoginSchema> & { generic?: string });
}

export let loader: LoaderFunction = async ({ request }) => {
  let userId = await getUserId(request);
  if (!userId) return json(null);

  // we have a userId in the session, let's validate that it's actually a user
  // if it is, we'll redirect to their snkrs page
  // otherwise we'll destroy the session and redirect to the landing page
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (user) return redirect(`/${user.username}`);

  let session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
};

interface ActionData {
  errors: PossibleLoginErrors;
}

export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData();
  let email = formData.get('email');
  let password = formData.get('password');

  let url = new URL(request.url);
  let redirectTo = url.searchParams.get('returnTo');

  let valid = loginSchema.safeParse({ email, password });
  if (!valid.success) {
    return json<ActionData>(
      { errors: valid.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  let foundUser = await prisma.user.findUnique({
    where: { email: valid.data.email },
  });

  if (!foundUser) {
    return json<ActionData>(
      { errors: { email: ['Invalid email or password'] } },
      { status: 400 }
    );
  }

  let validCredentials = await verify(valid.data.password, foundUser.password);

  if (!validCredentials) {
    return json<ActionData>({
      errors: { email: ['Invalid email or password'] },
    });
  }

  return createUserSession(
    request,
    foundUser.id,
    redirectTo ?? `/${foundUser.username}`
  );
};

export let meta: MetaFunction = () => {
  return getSeoMeta({
    title: 'Log in',
    description: 'show off your sneaker collection',
  });
};

export let handle: RouteHandle = {
  bodyClassName: 'bg-gray-50',
};

export default function LoginPage() {
  let data = useLoaderData<RouteData>();
  let actionData = useActionData<ActionData>();
  let transition = useTransition();
  let pendingForm = transition.submission;

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form method="post">
            <fieldset disabled={!!pendingForm} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    aria-invalid={actionData?.errors.email ? true : undefined}
                    aria-errormessage={
                      actionData?.errors.email ? 'email-error' : undefined
                    }
                  />
                  {actionData?.errors.email && (
                    <Alert className="text-red-500 mt-1" id="email-error">
                      {actionData.errors.email.map(error => (
                        <p key={error}>{error}</p>
                      ))}
                    </Alert>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    aria-invalid={
                      actionData?.errors.password ? true : undefined
                    }
                    aria-errormessage={
                      actionData?.errors.password ? 'password-error' : undefined
                    }
                  />
                  {actionData?.errors.password && (
                    <Alert className="text-red-500 mt-1" id="password-error">
                      {actionData.errors.password.map(error => (
                        <p key={error}>{error}</p>
                      ))}
                    </Alert>
                  )}
                </div>
              </div>

              {/* <div className="flex items-center justify-end">
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div> */}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </fieldset>
          </Form>
        </div>
      </div>
    </div>
  );
}
