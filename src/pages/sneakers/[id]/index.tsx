import React from 'react';
import { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Sneaker } from '@prisma/client';
import useSWR from 'swr';
import { SimpleImg } from 'react-simple-img';

import { StockXResponse } from '../../../../@types/stockx';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';
import { prisma } from 'prisma/db';

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const sneakers = await prisma.sneaker.findMany();

  return {
    fallback: true,
    paths: sneakers.map((sneaker: Sneaker) => ({
      params: { id: sneaker.id },
    })),
  };
};

interface SneakerISODate extends Omit<Sneaker, 'purchaseDate' | 'soldDate'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  purchaseDate: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  soldDate: string | null;
}

interface Props {
  sneaker?: SneakerISODate;
  stockx?: StockXResponse;
  id?: string;
}

export const getStaticProps: GetStaticProps<Props> = async ({
  params = {},
}) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const rawSneaker = await prisma.sneaker.findOne({
    where: { id },
  });

  const sneaker = rawSneaker
    ? {
        ...rawSneaker,
        purchaseDate: rawSneaker.purchaseDate?.toISOString() ?? null,
        soldDate: rawSneaker.soldDate?.toISOString() ?? null,
      }
    : undefined;

  const stockx = sneaker?.stockxProductId
    ? await fetch(
        `https://stockx.com/api/products/${sneaker.stockxProductId}/activity?state=480&currency=USD&limit=1&page=1&sort=createdAt&order=DESC&country=US`,
        {
          headers: {
            accept: 'application/json',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
          },
        }
      ).then(r => r.json())
    : null;

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: {
      id,
      sneaker,
      stockx,
    },
  };
};

const SneakerPage: NextPage<Props> = ({ id, sneaker, stockx }) => {
  const { data } = useSWR<SneakerISODate>(() => `/api/sneakers/${id}`, {
    initialData: sneaker,
  });

  if (!sneaker || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${data.brand} ${data.model} – ${data.colorway}`;
  const year = data.purchaseDate && new Date(data.purchaseDate).getFullYear();

  const description = `Logan bought the ${data.brand} ${data.model}${
    data.purchaseDate &&
    ` on ${formatDate(data.purchaseDate, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`
  }`;

  const { imagePublicId } = data;
  const image1x = getCloudinaryURL(imagePublicId, { width: 400, crop: 'pad' });
  const image2x = getCloudinaryURL(imagePublicId, { width: 800, crop: 'pad' });
  const image3x = getCloudinaryURL(imagePublicId, { width: 1200, crop: 'pad' });

  return (
    <main className="container h-full p-4 mx-auto">
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
        <SimpleImg
          src={image1x}
          srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
          alt={title}
          height={200}
          width={200}
          applyAspectRatio
          className="w-full h-full overflow-hidden rounded-md"
        />
        <div>
          <h1 className="text-2xl">{title}</h1>
          <p className="text-xl">{formatMoney(data.price)}</p>
          {stockx?.ProductActivity?.[0].amount && (
            <time
              className="text-xl"
              dateTime={stockx.ProductActivity[0].createdAt}
            >
              Last sale on StockX{' '}
              {formatMoney(stockx.ProductActivity[0].amount * 100)}
            </time>
          )}
          {data.purchaseDate && (
            <p>
              <time className="text-md" dateTime={data.purchaseDate}>
                Purchased {formatDate(data.purchaseDate)}
              </time>
            </p>
          )}

          {data.sold && data.soldDate && (
            <p>
              <time className="text-md" dateTime={data.soldDate}>
                Sold {formatDate(data.soldDate)}{' '}
                {data?.soldPrice && <>For {formatMoney(data.soldPrice)}</>}
              </time>
            </p>
          )}

          {year && (
            <Link href="/sneakers/yir/[year]" as={`/sneakers/yir/${year}`}>
              <a className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline">
                See others purchased in {year}
              </a>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default SneakerPage;
