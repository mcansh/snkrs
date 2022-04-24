import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';

import { requireUser, requireUserId } from '~/session.server';
import { prisma } from '~/db.server';
import { editProfile } from '~/lib/schemas/user.server';
import type { PossibleEditProfileErrors } from '~/lib/schemas/user.server';
import { getSeoMeta } from '~/seo';

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
}

export let loader: LoaderFunction = async ({ request }) => {
  let user = await requireUser(request);
  let userSettings = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  return json<RouteData>({
    user: {
      email: user.email,
      username: user.username,
      settings: userSettings
        ? {
            showPurchasePrice: userSettings.showPurchasePrice,
            showRetailPrice: userSettings.showRetailPrice,
            showTotalPrice: userSettings.showTotalPrice,
          }
        : null,
    },
  });
};

interface ActionData {
  errors: PossibleEditProfileErrors;
}

export let action: ActionFunction = async ({ request }) => {
  let userId = await requireUserId(request);

  let formData = await request.formData();

  let email = formData.get('email');
  let username = formData.get('username');
  let showPurchasePrice = formData.get('showPurchasePrice');
  let showRetailPrice = formData.get('showRetailPrice');
  let showTotalPrice = formData.get('showTotalPrice');

  let valid = editProfile.safeParse({
    email,
    username,
    settings: {
      showPurchasePrice: showPurchasePrice === 'on',
      showRetailPrice: showRetailPrice === 'on',
      showTotalPrice: showTotalPrice === 'on',
    },
  });

  if (!valid.success) {
    return json<ActionData>({
      errors: valid.error.flatten().fieldErrors,
    });
  }

  await prisma.user.update({
    data: {
      email: valid.data.email,
      username: valid.data.username,
      settings: {
        upsert: {
          create: {
            showPurchasePrice: valid.data.settings.showPurchasePrice,
            showRetailPrice: valid.data.settings.showRetailPrice,
            showTotalPrice: valid.data.settings.showTotalPrice,
          },
          update: {
            showPurchasePrice: valid.data.settings.showPurchasePrice,
            showRetailPrice: valid.data.settings.showRetailPrice,
            showTotalPrice: valid.data.settings.showTotalPrice,
          },
        },
      },
    },
    where: { id: userId },
  });

  return redirect('/profile');
};

export let meta: MetaFunction = () => {
  return getSeoMeta({ title: 'Edit Profile' });
};

export default function ProfilePage() {
  let data = useLoaderData<RouteData>();
  let actionData = useActionData<ActionData>();
  let transition = useTransition();
  let pendingForm = transition.submission;

  return (
    <div className="max-w-screen-md px-6 mx-auto ">
      <h1>Edit Account</h1>

      {actionData?.errors && (
        <div>
          <div>
            Excuse me while I&apos;m being lazy, but here&apos;s the errors.
          </div>
          <pre>{JSON.stringify(actionData.errors)}</pre>
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

          <button
            type="submit"
            disabled={!!pendingForm}
            // text={<span>Save changes</span>}
            // textLoading={<span>Saving...</span>}
            // ariaText="Save changes"
            // ariaLoadingAlert="Attempting to save changes"
            // ariaSuccessAlert="Successfully saved changes, redirecting..."
            // ariaErrorAlert="Error saving changes"
            // className={`px-4 py-2 disabled:cursor-not-allowed border border-transparent shadow-sm text-base font-medium rounded text-white ${colors[state].bg} ${colors[state].hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[state].ring}`}
          >
            Save changes
          </button>
        </fieldset>
      </Form>
    </div>
  );
}
