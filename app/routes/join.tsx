import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { Alert } from "@reach/alert";
import clsx from "clsx";
import { route } from "routes-gen";

import { prisma } from "~/db.server";
import { registerSchema } from "~/lib/schemas/user.server";
import { hash } from "~/lib/auth.server";
import { createUserSession, getUserId } from "~/session.server";
import type { RouteHandle } from "~/lib/use-matches";

export let loader = async ({ request }: LoaderArgs) => {
  let userId = await getUserId(request);
  if (userId) return redirect("/");
  return json(null);
};

export let action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();

  let result = registerSchema.safeParse(formData);

  if (!result.success) {
    return json(
      { errors: result.error.formErrors.fieldErrors },
      { status: 422 }
    );
  }

  let foundUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: result.data.email }, { username: result.data.username }],
    },
  });

  if (foundUser && foundUser.email === result.data.email) {
    return json(
      { errors: { email: ["A user with this email already exists"] } },
      { status: 422 }
    );
  }

  if (foundUser && foundUser.username === result.data.username) {
    return json(
      { errors: { username: ["A user with this username already exists"] } },
      { status: 422 }
    );
  }

  let hashed = await hash(result.data.password);

  let newUser = await prisma.user.create({
    data: {
      email: result.data.email,
      familyName: result.data.familyName,
      givenName: result.data.givenName,
      password: hashed,
      username: result.data.username,
      fullName: `${result.data.givenName} ${result.data.familyName}`,
    },
  });

  let redirectTo = new URL(request.url).searchParams.get("redirectTo");

  return createUserSession(
    request,
    newUser.id,
    redirectTo ?? `/${newUser.username}`
  );
};

export let meta: MetaFunction = () => ({
  title: "Join",
  description: "show off your sneaker collection",
});

export let handle: RouteHandle = {
  bodyClassName: "bg-gray-50",
};

export default function JoinPage() {
  let actionData = useActionData<typeof action>();
  let navigation = useNavigation();
  let location = useLocation();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join now and start showing off your collection
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form method="post">
            <fieldset disabled={pendingForm} className="space-y-6">
              {inputs.map((input) => {
                let error =
                  actionData && input.name in actionData.errors
                    ? actionData.errors[input.name]
                    : null;
                return (
                  <div key={input.name}>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {input.label}
                    </label>
                    <div className="mt-1">
                      <input
                        id={input.name}
                        name={input.name}
                        type={input.type}
                        autoComplete={input.autoComplete}
                        className={clsx(
                          "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm",
                          error
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                        )}
                        aria-invalid={error ? true : undefined}
                        aria-errormessage={
                          error ? `${input.name}-error` : undefined
                        }
                      />
                      {error && (
                        <Alert
                          className="mt-2 text-sm text-red-600"
                          id={`${input.name}-error`}
                        >
                          {error.map((errorMessage: string) => (
                            <p className="mt-1" key={errorMessage}>
                              {errorMessage}
                            </p>
                          ))}
                        </Alert>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-900">
                    Already have an account?
                  </span>
                </div>
                <div className="text-sm">
                  <Link
                    to={route("/login")}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join now
                </button>
              </div>
            </fieldset>
          </Form>
        </div>
      </div>
    </div>
  );
}

let inputs = [
  {
    name: "givenName",
    label: "First Name",
    type: "text",
    autoComplete: "givenName",
  },
  {
    name: "familyName",
    label: "Last Name",
    type: "text",
    autoComplete: "familyName",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    autoComplete: "email",
  },
  {
    name: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
] as const;
