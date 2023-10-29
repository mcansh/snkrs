import type { LoaderFunctionArgs } from "@remix-run/node";
import { $path } from "remix-routes";

import { getUserId, createUserSession } from "~/session.server";
import { prisma } from "~/db.server";

import Home, { loader as homeLoader } from "./home";
export { meta } from "./home";

export let loader = async ({ request, ...args }: LoaderFunctionArgs) => {
  let userId = await getUserId(request);
  if (userId) {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return createUserSession(
        request,
        user.id,
        $path("/:username", { username: user.username }),
      );
    }
  }

  return homeLoader({ request, ...args });
};

export default Home;
