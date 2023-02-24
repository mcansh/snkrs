import type { LoaderArgs } from "@remix-run/node";
import { route } from "routes-gen";


import { getUserId, createUserSession } from "~/session.server";
import { prisma } from "~/db.server";

import Home, { loader as homeLoader } from "./home";
export { meta } from "./home";

export const loader = async ({ request, ...args }: LoaderArgs) => {
  let userId = await getUserId(request);
  if (userId) {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      return createUserSession(
        request,
        user.id,
        route("/:username", { username: user.username })
      );
    }
  }

  return homeLoader({ request, ...args });
};

export default Home;
