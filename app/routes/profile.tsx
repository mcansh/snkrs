import * as React from 'react';
import { Form, redirect, useTransition, useLoaderData, json } from 'remix';
import { ValidationError } from 'yup';
import type {
  RouteComponent,
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  LinksFunction,
} from 'remix';

import { getSession, destroySession } from '../session';
import { sessionKey } from '../constants';
import { prisma } from '../db.server';
import { editProfile } from '../lib/schemas/edit-profile.server';
import { yupToObject } from '../lib/yup-to-object';
import { LoadingButton } from '../components/loading-button';
import saveIcon from '../icons/outline/save.svg';
import checkIcon from '../icons/outline/check.svg';
import refreshIcon from '../icons/refresh-clockwise.svg';
import exclamationCircleIcon from '../icons/outline/exclamation-circle.svg';
import type { LoadingButtonProps } from '../components/loading-button';
import type { EditProfileSchema } from '../lib/schemas/edit-profile.server';

interface RouteData {
  user: {
    email: string;
    username: string;
    settings: {
      showPurchasePrice: boolean;
      showRetailPrice: boolean;
      showTotalPrice: boolean;
    } | null;
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
      settings: true,
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

  return json(data);
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

  const formData = await request.formData();

  const email = formData.get('email');
  const username = formData.get('username');
  const showPurchasePrice = formData.get('showPurchasePrice');
  const showRetailPrice = formData.get('showRetailPrice');
  const showTotalPrice = formData.get('showTotalPrice');

  try {
    const valid = await editProfile.validate(
      {
        email,
        username,
        settings: {
          showPurchasePrice: showPurchasePrice === 'on',
          showRetailPrice: showRetailPrice === 'on',
          showTotalPrice: showTotalPrice === 'on',
        },
      },
      { abortEarly: false }
    );

    await prisma.user.update({
      data: {
        email: valid.email,
        username: valid.username,
        settings: {
          upsert: {
            create: {
              showPurchasePrice: valid.settings.showPurchasePrice,
              showRetailPrice: valid.settings.showRetailPrice,
              showTotalPrice: valid.settings.showTotalPrice,
            },
            update: {
              showPurchasePrice: valid.settings.showPurchasePrice,
              showRetailPrice: valid.settings.showRetailPrice,
              showTotalPrice: valid.settings.showTotalPrice,
            },
          },
        },
      },
      where: { id: userId },
    });

    return redirect('/profile');
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ValidationError) {
      const aggregateErrors = yupToObject<EditProfileSchema>(error);
      session.flash('profileError', JSON.stringify(aggregateErrors));
    }
    return redirect(`/profile`);
  }
};

const meta: MetaFunction = () => ({
  title: 'Edit Profile',
});

const links: LinksFunction = () => [
  {
    href: LoadingButton.styles,
    rel: 'stylesheet',
  },
];

const ProfilePage: RouteComponent = () => {
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
    <div className="max-w-screen-md px-6 mx-auto ">
      <h1>Edit Account</h1>

      {data.profileError && (
        <div>
          <div>
            Excuse me while I&apos;m being lazy, but here&apos;s the errors.
          </div>
          <pre>{JSON.stringify(data.profileError)}</pre>
        </div>
      )}

      <Form method="post" replace>
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <label>
            <span>Email:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="email"
              name="email"
              defaultValue={data.user.email}
            />
          </label>
          <label>
            <span>Username:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="text"
              name="username"
              defaultValue={data.user.username}
            />
          </label>

          <label>
            <span className="mr-2">Show Purchase Price of sneakers:</span>
            <input
              type="checkbox"
              name="showPurchasePrice"
              defaultChecked={data.user.settings?.showPurchasePrice ?? true}
            />
          </label>

          <label>
            <span className="mr-2">Show Retail Price of sneakers:</span>
            <input
              type="checkbox"
              name="showRetailPrice"
              defaultChecked={data.user.settings?.showRetailPrice ?? true}
            />
          </label>

          <label>
            <span className="mr-2">Show Total Price of collection:</span>
            <input
              type="checkbox"
              name="showTotalPrice"
              defaultChecked={data.user.settings?.showTotalPrice}
            />
          </label>

          <LoadingButton
            type="submit"
            disabled={!!pendingForm}
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
export { action, links, loader, meta };
