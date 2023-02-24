import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { prisma } from "~/db.server";
import {
  getUserId,
  isImpersonating,
  logout,
  stopImpersonating,
} from "~/session.server";

export let loader = async ({ request }: LoaderArgs) => {
  let user = await getUserId(request);
  if (!user) return redirect("/");

  let impersonatedUserId = await isImpersonating(request);
  let isImpersonatingUser = !!impersonatedUserId;
  let impersonatedUser = impersonatedUserId
    ? await prisma.user.findUnique({
        where: { id: impersonatedUserId },
      })
    : null;

  return json({
    user,
    isImpersonatingUser,
    impersonatedUser,
  });
};

export let action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();
  let impersonate = formData.get("impersonate");
  if (impersonate === "stop") {
    return stopImpersonating(request);
  }
  return logout(request);
};

export default function LogoutPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <Form
      reloadDocument
      method="post"
      className="h-full grid place-items-center min-h-screen"
    >
      <p>good bye {data.user}</p>
      <div className="flex items-center gap-4">
        {data.isImpersonatingUser ? (
          <button
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            type="submit"
            name="impersonate"
            value="stop"
          >
            End Impersonation of {data.impersonatedUser?.id}
          </button>
        ) : null}
        <button
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          type="submit"
        >
          Log out
        </button>
      </div>
    </Form>
  );
}
