import * as React from 'react';
import {
  useRouteData,
  redirect,
  Form,
  usePendingFormSubmit,
  block,
} from 'remix';
import { json } from 'remix-utils';
import { ValidationError } from 'yup';
import etag from 'etag';

import { getSession, destroySession } from '../session';
import { sessionKey } from '../constants';
import { prisma } from '../db';
import { editProfile } from '../lib/schemas/edit-profile';
import { yupToObject } from '../lib/yup-to-object';
import { LoadingButton } from '../components/loading-button';
import saveIcon from '../icons/outline/save.svg';
import checkIcon from '../icons/outline/check.svg';
import refreshIcon from '../icons/refresh-clockwise.svg';
import exclamationCircleIcon from '../icons/outline/exclamation-circle.svg';

import type { LoadingButtonProps } from '../components/loading-button';
import type { EditProfileSchema } from '../lib/schemas/edit-profile';
import type {
  RouteComponent,
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  LinksFunction,
  HeadersFunction,
} from 'remix';

interface RouteData {
  user: {
    email: string;
    username: string;
  };
  profileError: Partial<EditProfileSchema> | undefined;
}

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get(sessionKey);
  const profileError = session.get('profileError');

  if (!userId) {
    return redirect(`/login?returnTo=/profile`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
    },
  });

  if (!user) {
    return redirect(`/login?returnTo=/profile`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  }

  const data: RouteData = { user, profileError };

  return json<RouteData>(data, {
    headers: {
      ETag: etag(JSON.stringify(data), { weak: true }),
    },
  });
};

const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));

  const userId = session.get(sessionKey);

  if (!userId) {
    return redirect(`/login?returnTo=/profile`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  }

  const req = await request.text();
  const formData = new URLSearchParams(req);

  try {
    const valid = await editProfile.validate(Object.fromEntries(formData), {
      abortEarly: false,
    });

    const updatedUser = await prisma.user.update({
      data: {
        email: valid.email,
        username: valid.username,
      },
      where: { id: userId },
    });

    return redirect(`/${updatedUser.username}`);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ValidationError) {
      const aggregateErrors = yupToObject<EditProfileSchema>(error);
      session.flash('profileError', JSON.stringify(aggregateErrors));
    }
    return redirect(`/profile`);
  }
};

const headers: HeadersFunction = ({ loaderHeaders }) => ({
  ETag: loaderHeaders.get('ETag') ?? '',
});

const meta: MetaFunction = () => ({
  title: 'Edit Profile',
});

const links: LinksFunction = () => [
  block({
    rel: 'preload',
    href: saveIcon,
    as: 'image',
    type: 'image/svg+xml',
  }),
];

const ProfilePage: RouteComponent = () => {
  const data = useRouteData<RouteData>();
  const pendingForm = usePendingFormSubmit();

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
    } else if (data.profileError) {
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
  }, [data.profileError, pendingForm]);

  return (
    <div>
      <h1>Edit Account</h1>

      {data.profileError && (
        <div>
          <div>
            Excuse me while I&apos;m being lazy, but here&apos;s the errors.
          </div>
          <pre>{JSON.stringify(data.profileError)}</pre>
        </div>
      )}

      <Form method="post">
        <fieldset disabled={!!pendingForm}>
          <label htmlFor="email">
            <span>Email:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="email"
              name="email"
              id="email"
              defaultValue={data.user.email}
            />
          </label>
          <label htmlFor="username">
            <span>Username:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="text"
              name="username"
              id="username"
              defaultValue={data.user.username}
            />
          </label>
          <LoadingButton
            type="submit"
            state={state}
            text={<span>Save changes</span>}
            textLoading={<span>Saving...</span>}
            ariaText="Save changes"
            ariaLoadingAlert="Attempting to save changes"
            ariaSuccessAlert="Successfully saved changes, redirecting..."
            ariaErrorAlert="Error saving changes"
            icon={
              <svg className="w-6 h-6">
                <use href={`${saveIcon}#save`} />
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

export default ProfilePage;
export { action, headers, links, loader, meta };
