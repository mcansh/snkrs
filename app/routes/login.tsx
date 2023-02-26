import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { Alert } from "@reach/alert";
import { route } from "routes-gen";

import { verify } from "~/lib/auth.server";
import { prisma } from "~/db.server";
import { loginSchema } from "~/lib/schemas/user.server";
import {
  createUserSession,
  getSession,
  getUserId,
  sessionStorage,
} from "~/session.server";
import type { RouteHandle } from "~/lib/use-matches";
import { getPageTitle, mergeMeta } from "~/meta";

export let loader = async ({ request }: LoaderArgs) => {
  let userId = await getUserId(request);
  if (!userId) return json(null);

  // we have a userId in the session, let's validate that it's actually a user
  // if it is, we'll redirect to their snkrs page
  // otherwise we'll destroy the session and redirect to the landing page
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (user) {
    return redirect(`/${user.username}`);
  }

  let session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
};

export let action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();

  let url = new URL(request.url);
  let redirectTo = url.searchParams.get("returnTo");

  let valid = loginSchema.safeParse(formData);
  if (!valid.success) {
    return json(
      { errors: valid.error.formErrors.fieldErrors },
      { status: 422 }
    );
  }

  let foundUser = await prisma.user.findUnique({
    where: { email: valid.data.email },
  });

  if (!foundUser) {
    return json(
      { errors: { email: ["Invalid email or password"] } },
      { status: 422 }
    );
  }

  let validCredentials = await verify(valid.data.password, foundUser.password);

  if (!validCredentials) {
    return json(
      { errors: { email: ["Invalid email or password"] } },
      { status: 422 }
    );
  }

  return createUserSession(
    request,
    foundUser.id,
    redirectTo ?? `/${foundUser.username}`
  );
};

export let meta: V2_MetaFunction = mergeMeta(() => {
  return [{ title: getPageTitle("Log in") }];
});

export let handle: RouteHandle = {
  bodyClassName: "bg-gray-50",
};

export default function LoginPage() {
  let actionData = useActionData<typeof action>();
  let navigation = useNavigation();
  let location = useLocation();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";

  let emailErrors =
    actionData && "email" in actionData.errors && actionData.errors.email;
  let passwordErrors =
    actionData && "password" in actionData.errors && actionData.errors.password;

  return (
    <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg bg-white py-8 px-4 shadow sm:px-10">
          <Form method="post">
            <fieldset disabled={pendingForm} className="space-y-6">
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
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    aria-invalid={emailErrors ? true : undefined}
                    aria-errormessage={emailErrors ? "email-error" : undefined}
                  />
                  {emailErrors && (
                    <Alert
                      className="mt-2 text-sm text-red-600"
                      id="email-error"
                    >
                      {emailErrors.map((error) => (
                        <p className="mt-1" key={error}>
                          {error}
                        </p>
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
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    aria-invalid={passwordErrors ? true : undefined}
                    aria-errormessage={
                      passwordErrors ? "password-error" : undefined
                    }
                  />
                  {passwordErrors && (
                    <Alert
                      className="mt-2 text-sm text-red-600"
                      id="password-error"
                    >
                      {passwordErrors.map((error) => (
                        <p className="mt-1" key={error}>
                          {error}
                        </p>
                      ))}
                    </Alert>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-900">New here?</span>
                </div>
                <div className="text-sm">
                  <Link
                    to={route("/join")}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Join
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
