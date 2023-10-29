import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { getUserId, logout } from "~/session.server";

export let loader = async ({ request }: LoaderFunctionArgs) => {
  let user = await getUserId(request);
  if (!user) return redirect("/");
  return json(null);
};

export let action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};

export default function LogoutPage() {
  return (
    <Form
      reloadDocument
      method="post"
      className="grid h-full min-h-screen place-items-center"
    >
      <button
        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        type="submit"
      >
        Log out
      </button>
    </Form>
  );
}
