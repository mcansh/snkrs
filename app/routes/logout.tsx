import { Form, json, redirect } from 'remix';
import type { ActionFunction, LoaderFunction } from 'remix';

import { getUserId, logout } from '~/session.server';

export let loader: LoaderFunction = async ({ request }) => {
  let user = await getUserId(request);
  if (!user) return redirect('/');
  return json(null);
};

export let action: ActionFunction = async ({ request }) => {
  return logout(request);
};

export default function LogoutPage() {
  return (
    <Form
      reloadDocument
      method="post"
      className="h-full grid place-items-center min-h-screen"
    >
      <button
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        type="submit"
      >
        Log out
      </button>
    </Form>
  );
}
