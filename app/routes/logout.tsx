import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { getUserId, logout } from "~/session.server";

export let loader = async ({ request }: LoaderArgs) => {
  let user = await getUserId(request);
  if (!user) return redirect("/");
  return json(null);
};

export let action = async ({ request }: ActionArgs) => {
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
