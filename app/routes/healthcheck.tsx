import type { V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { prisma } from '~/db.server';

interface RouteData {
  ok: boolean;
}

export async function loader() {
  try {
    await prisma.user.count();
    return json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    return json({ ok: false }, 500);
  }
}

export let meta: V2_MetaFunction = ({ matches }) => {
  let matchedMeta = matches
    .flatMap(match => match.meta)
    // @ts-expect-error types what can i say
    .filter(m => !m.title);
  return [{ title: 'Health Check' }, ...matchedMeta];
};

export default function HealthCheckPage() {
  let data = useLoaderData<RouteData>();
  return data.ok ? <h1>Everything is fine</h1> : <h1>Something went wrong</h1>;
}
