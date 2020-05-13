import React from 'react';
import { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Sneaker, PrismaClient } from '@prisma/client';

import { StockXResponse } from '../../../@types/stockx';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const prisma = new PrismaClient({ forceTransactions: true });

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
  const prisma = new PrismaClient({ forceTransactions: true });

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
  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.model} by ${sneaker.brand} in the ${sneaker.colorway} colorway`;

  return (
    <div className="w-11/12 h-full py-4 mx-auto">
      <NextSeo
        title={title}
        openGraph={{
          title,
          images: [
            {
              url: getCloudinaryURL(sneaker.imagePublicId),
              alt: title,
            },
          ],
        }}
      />
      <Link href="/">
        <a>Back</a>
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div>
          <img
            loading="lazy"
            src={getCloudinaryURL(sneaker.imagePublicId)}
            alt={title}
            className="object-contain overflow-hidden rounded-md"
          />
        </div>
        <div>
          <h1 className="text-2xl">
            {sneaker.brand} {sneaker.model} {sneaker.colorway}
          </h1>
          <p className="text-xl">{formatMoney(sneaker.price)}</p>
          {stockx?.ProductActivity?.[0].amount && (
            <time
              className="text-xl"
              dateTime={formatDate(stockx.ProductActivity[0].createdAt, {
                hour: 'numeric',
                minute: 'numeric',
              })}
            >
              Last sale on StockX{' '}
              {formatMoney(stockx.ProductActivity[0].amount * 100)}
            </time>
          )}
          {sneaker.purchaseDate && (
            <p>
              <time className="text-md" dateTime={sneaker.purchaseDate}>
                Purchased {formatDate(sneaker.purchaseDate)}
              </time>
            </p>
          )}

          {sneaker.sold && sneaker.soldDate && (
            <p>
              <time className="text-md" dateTime={sneaker.soldDate}>
                Sold {formatDate(sneaker.soldDate)}{' '}
                {sneaker?.soldPrice && (
                  <>For {formatMoney(sneaker.soldPrice)}</>
                )}
              </time>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SneakerPage;
