import React from 'react';
import type { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import type { Sneaker as SneakerType } from '@prisma/client';
import Image from 'next/image';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';
import { prisma } from 'prisma/db';
import { useUser } from 'src/hooks/use-user';
import { useSneaker } from 'src/hooks/use-sneakers';
import { getParam } from 'src/utils/get-params';

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const sneakers = await prisma.sneaker.findMany();

  return {
    fallback: 'blocking',
    paths: sneakers.map(sneaker => ({
      params: { id: sneaker.id },
    })),
  };
};

type SneakerWithUser = SneakerType & { User: { name: string } };

interface Props {
  // eslint-disable-next-line @typescript-eslint/ban-types
  sneaker: SneakerWithUser | null;
  id?: string;
}

export const getStaticProps: GetStaticProps<Props> = async ({
  params = {},
}) => {
  const id = getParam(params.id);

  const sneaker = await prisma.sneaker.findOne({
    where: { id },
    include: { User: { select: { name: true } } },
  });

  return {
    // because this data is slightly more dynamic, update it every hour
    revalidate: 60 * 60,
    props: { id, sneaker },
  };
};

const SneakerPage: NextPage<Props> = ({ id, sneaker }) => {
  const { data } = useSneaker(id, sneaker ?? undefined);
  const { user } = useUser();

  if (!data) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${data.brand} ${data.model} – ${data.colorway}`;
  const year = new Date(data.purchaseDate).getFullYear();

  const belowRetail = data.retailPrice > data.price;
  const atRetail = data.retailPrice === data.price;

  const description = `${data.User.name} bought the ${data.brand} ${
    data.model
  } on ${formatDate(data.purchaseDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}
  }`;

  const { imagePublicId } = data;
  const image1x = getCloudinaryURL(imagePublicId, { width: 400, crop: 'pad' });
  const image2x = getCloudinaryURL(imagePublicId, { width: 800, crop: 'pad' });
  const image3x = getCloudinaryURL(imagePublicId, { width: 1200, crop: 'pad' });

  return (
    <main className="container min-h-full p-4 mx-auto">
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          title,
          images: [
            {
              url: image1x,
              alt: title,
              width: 400,
              height: 400,
            },
            {
              url: image2x,
              alt: title,
              width: 400,
              height: 400,
            },
            {
              url: image3x,
              alt: title,
              width: 1200,
              height: 1200,
            },
          ],
        }}
      />
      <Link href="/">
        <a>Back</a>
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <Image
          src={getCloudinaryURL(imagePublicId)}
          alt={title}
          height={640}
          width={640}
          className="w-full h-full overflow-hidden rounded-md"
        />
        <div className="flex flex-col">
          <h1 className="text-2xl">{title}</h1>

          {atRetail ? (
            <p className="text-xl">{formatMoney(data.price)}</p>
          ) : (
            <p className="text-xl">
              Bought {belowRetail ? 'below' : 'above'} retail (
              {formatMoney(data.retailPrice)}) {belowRetail ? '🔥' : '😭'} for{' '}
              {formatMoney(data.price)}
            </p>
          )}

          <p className="text-md">
            Purchased on{' '}
            <time dateTime={data.purchaseDate.toISOString()}>
              {formatDate(data.purchaseDate)}
            </time>
          </p>

          {data.sold && data.soldDate && (
            <p className="text-md">
              Sold{' '}
              <time dateTime={data.soldDate.toISOString()}>
                {formatDate(data.soldDate)}{' '}
                {data.soldPrice && <>For {formatMoney(data.soldPrice)}</>}
              </time>
            </p>
          )}

          <Link href="/sneakers/yir/[year]" as={`/sneakers/yir/${year}`}>
            <a className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline">
              See others purchased in {year}
            </a>
          </Link>

          {user?.isLoggedIn && (
            <Link href={`/sneakers/${data.id}/edit`}>
              <a className="block mt-auto text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline">
                Edit Sneaker
              </a>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default SneakerPage;
