import type {
  LoaderArgs,
  RouteComponent,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { prisma } from "~/db.server";
import { getPageTitle, mergeMeta } from "~/meta";

let loader = async (_args: LoaderArgs) => {
  try {
    await prisma.user.count();
    return json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    return json({ ok: false }, 500);
  }
};

let meta: V2_MetaFunction = mergeMeta(() => {
  return [{ title: getPageTitle("Health Check") }];
});

let Page: RouteComponent = () => {
  let data = useLoaderData<typeof loader>();
  return data.ok ? <h1>Everything is fine</h1> : <h1>Something went wrong</h1>;
};

export default Page;
export { loader, meta };
