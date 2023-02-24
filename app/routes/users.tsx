import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { route } from "routes-gen";

import { prisma } from "~/db.server";
import { createImpersonatedUserSession, requireUser } from "~/session.server";

export async function loader({ request }: DataFunctionArgs) {
  let user = await requireUser(request);

  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403, statusText: "Forbidden" });
  }

  let users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  });

  return json({ users });
}

export async function action({ request }: DataFunctionArgs) {
  let user = await requireUser(request);

  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403, statusText: "Forbidden" });
  }

  let formData = await request.formData();
  let user_id = formData.get("impersonate");

  if (typeof user_id !== "string") {
    throw new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
    });
  }

  let impersonatedUser = await prisma.user.findUnique({
    where: { id: user_id },
  });

  if (!impersonatedUser) {
    throw new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
    });
  }

  return createImpersonatedUserSession(request, impersonatedUser.id, "/");
}

export default function Users() {
  let data = useLoaderData<typeof loader>();
  return (
    <div className="">
      <h1 className="px-4 text-4xl font-semibold">Users</h1>
      <ul className="py-4">
        {data.users.map((user) => (
          <li
            key={user.id}
            className="even:bg-blue-100 odd:bg-gray-200 hover:even:bg-blue-300 hover:odd:bg-gray-400 flex justify-between items-center"
          >
            <Link
              className="block px-8 py-2"
              to={route("/:username", { username: user.username })}
            >
              {user.fullName}
            </Link>
            <Form method="post">
              <button
                type="submit"
                name="impersonate"
                value={user.id}
                aria-label={`Impersonate ${user.username}`}
                className="block px-8 py-2"
              >
                Impersonate
              </button>
            </Form>
          </li>
        ))}
      </ul>
    </div>
  );
}
