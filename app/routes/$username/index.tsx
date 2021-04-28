import * as React from 'react';
import type {
  RouteComponent,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import { useRouteData } from '@remix-run/react';
import type { Sneaker, Brand, User, Prisma } from '@prisma/client';

import FourOhFour, { meta as fourOhFourMeta } from '../404';
import { getCloudinaryURL } from '../../utils/cloudinary';
import { prisma } from '../../db';
import { NotFoundError } from '../../errors';
import { SneakerCard } from '../../components/sneaker';

interface RouteData {
  user: Pick<User, 'username' | 'id'> & {
    sneakers: Array<Sneaker & { brand: Brand }>;
    fullName: string;
  };
}

const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const { searchParams } = new URL(request.url);

    const sortQuery = searchParams.get('sort') as Prisma.SortOrder;
    const brandQuery = searchParams.get('brand');
    const brands = brandQuery ? brandQuery.split(',') : [];

    const sort =
      sortQuery && ['asc', 'desc'].includes(sortQuery) ? sortQuery : 'desc';

    const user = await prisma.user.findUnique({
      where: {
        username: params.username,
      },
      select: {
        username: true,
        id: true,
        givenName: true,
        familyName: true,
        sneakers: {
          where: brandQuery
            ? {
                brand: {
                  slug: {
                    in: brands,
                  },
                },
              }
            : undefined,
          include: { brand: true },
          orderBy: {
            purchaseDate: sort,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError();
    }

    return {
      user: {
        ...user,
        fullName: `${user.givenName} ${user.familyName}`,
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return json({ notFound: true }, { status: 404 });
    }
    console.error(error);
    return json({}, { status: 500 });
  }
};

const meta: MetaFunction = ({ data }: { data: RouteData }) => {
  if (!data.user) {
    return fourOhFourMeta();
  }

  const endsPossessive = data.user.fullName.toLowerCase().endsWith('s');

  const nameEndsWithS = endsPossessive
    ? `${data.user.fullName}'`
    : `${data.user.fullName}'s`;

  const [latestCop] = data.user.sneakers;

  return {
    title: `${nameEndsWithS} Sneaker Collection`,
    description: `${nameEndsWithS} sneaker collection`,
    'twitter:card': 'summary_large_image',
    'twitter:site': '@loganmcansh',
    // TODO: add support for linking your twitter account
    'twitter:creator': '@loganmcansh',
    'twitter:description': `${nameEndsWithS} sneaker collection`,

    // TODO: add support for user avatar, for now just link to latest purchase
    'twitter:image': latestCop ? getCloudinaryURL(latestCop.imagePublicId) : '',
    'twitter:image:alt': latestCop
      ? `${latestCop.brand.name} ${latestCop.model} in the ${latestCop.colorway} colorway`
      : '',
  };
};

const UserSneakersChildPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();

  if (!data.user) {
    return <FourOhFour />;
  }

  return (
    <ul className="grid grid-cols-2 px-4 py-6 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
      {data.user.sneakers.map(sneaker => (
        <SneakerCard key={sneaker.id} {...sneaker} />
      ))}
    </ul>
  );
};

export default UserSneakersChildPage;
export { loader, meta };
