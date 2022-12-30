import type {
  LoaderArgs,
  SerializeFrom,
  V2_MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { Prisma } from '@prisma/client';

import { prisma } from '~/db.server';
import { SneakerCard } from '~/components/sneaker';
import { getUserId, sessionStorage } from '~/session.server';
import { possessive } from '~/utils/possessive';
import { createTitle } from '~/seo';

export let loader = async ({ params, request }: LoaderArgs) => {
  let session = await sessionStorage.getSession(request.headers.get('Cookie'));
  let url = new URL(request.url);
  let userId = await getUserId(request);

  let selectedBrands = url.searchParams.getAll('brand');
  let sortQuery = url.searchParams.get('sort');
  let sort: Prisma.SortOrder = sortQuery === 'asc' ? 'asc' : 'desc';

  let user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      fullName: true,
      sneakers: {
        include: { brand: true },
        orderBy: { purchaseDate: sort },
      },
    },
  });

  if (!user) {
    throw new Response("This user doesn't exist", {
      status: 404,
      statusText: 'Not Found',
    });
  }

  let sessionUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          givenName: true,
          id: true,
        },
      })
    : null;

  let sneakers = selectedBrands.length
    ? user.sneakers.filter(sneaker =>
        selectedBrands.includes(sneaker.brand.slug)
      )
    : user.sneakers;

  return json(
    { user: { ...user, sneakers } },
    {
      headers: {
        'Set-Cookie': sessionUser
          ? await sessionStorage.commitSession(session)
          : '',
      },
    }
  );
};

export let meta: V2_MetaFunction<typeof loader | undefined> = ({
  data,
  matches,
}) => {
  let matchedMeta = matches
    .flatMap(match => match.meta)
    .filter(
      m =>
        // @ts-expect-error types what can i say
        !m.title ||
        // @ts-expect-error types what can i say
        m.name !== 'twitter:title' ||
        // @ts-expect-error types what can i say
        m.name !== 'twitter:description'
    );

  if (!data?.user) {
    return [...matchedMeta];
  }

  let name = possessive(data.user.fullName);

  let title = createTitle(`${name} Sneaker Collection`);
  let description = `${name} sneaker collection`;

  return [
    { title },
    { name: 'description', content: description },
    ...matchedMeta,
  ];
};

export default function UserSneakersPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <div className="mt-6 lg:mt-0 lg:col-span-2 xl:col-span-3">
      {data.user.sneakers.length === 0 ? (
        <EmptyState fullName={data.user.fullName} />
      ) : (
        <SneakerGrid sneakers={data.user.sneakers} />
      )}
    </div>
  );
}

function EmptyState({ fullName }: { fullName: string }) {
  return (
    <div className="px-6">
      <h1 className="text-2xl font-medium">
        {fullName} has no sneakers in their collection
      </h1>
    </div>
  );
}

function SneakerGrid({
  sneakers,
}: {
  sneakers: SerializeFrom<typeof loader>['user']['sneakers'];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {sneakers.map(sneaker => (
        <SneakerCard key={sneaker.id} {...sneaker} />
      ))}
    </ul>
  );
}
