import * as React from "react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";

import { requireUser, requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { editProfile } from "~/lib/schemas/user.server";
import { getSeoMeta } from "~/seo";
import { LoadingButton } from "~/components/loading-button";
import { Svg } from "~/components/heroicons";

let colors = {
  idle: {
    bg: "bg-indigo-600",
    hover: "hover:bg-indigo-700",
    ring: "focus:ring-indigo-700",
  },
  loading: {
    bg: "bg-indigo-600",
    hover: "hover:bg-indigo-700",
    ring: "focus:ring-indigo-700",
  },
  error: {
    bg: "bg-red-600",
    hover: "hover:bg-red-700",
    ring: "focus:ring-red-700",
  },
  success: {
    bg: "bg-green-600",
    hover: "hover:bg-green-700",
    ring: "focus:ring-green-700",
  },
};

export let loader = async ({ request }: LoaderArgs) => {
  let user = await requireUser(request);
  let userSettings = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  return json({
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

export let action = async ({ request }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let valid = editProfile.safeParse(formData);

  if (!valid.success) {
    return json({ errors: valid.error.flatten().fieldErrors }, { status: 422 });
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

  return redirect("/profile");
};

export let meta: MetaFunction = () => {
  return getSeoMeta({ title: "Edit Profile" });
};

export default function ProfilePage() {
  let data = useLoaderData<typeof loader>();
  let actionData = useActionData<typeof action>();
  let navigation = useNavigation();
  let location = useLocation();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";

  let [state, setState] = React.useState<
    "error" | "loading" | "idle" | "success"
  >(() =>
    actionData?.errors
      ? "error"
      : navigation.state === "submitting"
      ? "loading"
      : navigation.state
  );

  React.useEffect(() => {
    setState(
      actionData?.errors
        ? "error"
        : navigation.state === "submitting"
        ? "loading"
        : navigation.state
    );
  }, [navigation.state, actionData?.errors]);

  React.useEffect(() => {
    if (state !== "idle" && navigation.state === "idle") {
      let timerId = setTimeout(() => {
        setState("idle");
      }, 1_500);

      return () => clearTimeout(timerId);
    }
  }, [navigation.state, state]);

  return (
    <div className="mx-auto max-w-screen-md px-6 ">
      <h1>Edit Account</h1>

      {actionData?.errors ? (
        <div className="mb-4 rounded bg-red-500 p-4 text-white">
          <ul className="list-inside list-disc">
            {Object.entries(actionData.errors).map(([errorKey, errorValue]) => (
              <li key={`${errorKey}-${errorValue}`}>
                {errorKey}: {errorValue}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Form method="post" replace>
        <fieldset disabled={pendingForm} className="flex flex-col space-y-4">
          <label>
            <span>Email:</span>
            <input
              className="w-full rounded border border-gray-400 px-2 py-1"
              type="email"
              name="email"
              defaultValue={data.user.email}
            />
          </label>
          <label>
            <span>Username:</span>
            <input
              className="w-full rounded border border-gray-400 px-2 py-1"
              type="text"
              name="username"
              defaultValue={data.user.username}
            />
          </label>

          <label>
            <span className="mr-2">Show Purchase Price of sneakers:</span>
            <input
              type="checkbox"
              name="settings.showPurchasePrice"
              defaultChecked={data.user.settings?.showPurchasePrice ?? true}
            />
          </label>

          <label>
            <span className="mr-2">Show Retail Price of sneakers:</span>
            <input
              type="checkbox"
              name="settings.showRetailPrice"
              defaultChecked={data.user.settings?.showRetailPrice ?? true}
            />
          </label>

          <label>
            <span className="mr-2">Show Total Price of collection:</span>
            <input
              type="checkbox"
              name="settings.showTotalPrice"
              defaultChecked={data.user.settings?.showTotalPrice}
            />
          </label>

          <LoadingButton
            type="submit"
            disabled={pendingForm}
            text="Save changes"
            textLoading="Saving..."
            textError="Error saving changes"
            ariaText="Save changes"
            ariaLoadingAlert="Attempting to save changes"
            ariaSuccessAlert="Successfully saved changes, redirecting..."
            ariaErrorAlert="Error saving changes"
            className={`rounded border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm disabled:cursor-not-allowed ${colors[state].bg} ${colors[state].hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[state].ring}`}
            state={state}
            iconLoading={
              <Svg
                className="inline-block h-6 w-6 animate-spin fill-white"
                name="24:solid:refresh-clockwise"
              />
            }
            icon={
              <Svg
                className="ml-2 inline-block h-6 w-6 fill-white"
                name="24:solid:cloud"
              />
            }
            iconError={
              <Svg
                className="ml-2 inline-block h-6 w-6 fill-white"
                name="24:solid:exclamation-triangle"
              />
            }
            iconSuccess={
              <Svg
                className="ml-2 inline-block h-6 w-6 fill-white"
                name="24:solid:check"
              />
            }
          />
        </fieldset>
      </Form>
    </div>
  );
}
