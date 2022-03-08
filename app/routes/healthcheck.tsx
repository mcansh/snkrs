import type { RouteComponent, LoaderFunction, MetaFunction } from 'remix';
import { useLoaderData, json } from 'remix';

import { prisma } from '~/db.server';

interface RouteData {
  ok: boolean;
}

let loader: LoaderFunction = async () => {
  try {
    await prisma.user.count();
    return json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    return json({ ok: false }, 500);
  }
};

let meta: MetaFunction = () => ({
  title: 'Health Check',
});

let Page: RouteComponent = () => {
  let data = useLoaderData<RouteData>();
  return data.ok ? <h1>Everything is fine</h1> : <h1>Something went wrong</h1>;
};

export default Page;
export { loader, meta };
