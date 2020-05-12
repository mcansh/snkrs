import React from 'react';
import { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { PrismaClient, Sneaker } from '@prisma/client';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';

interface SneakerISODate extends Omit<Sneaker, 'purchaseDate' | 'soldDate'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  purchaseDate: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  soldDate: string | null;
}

interface Props {
  data: {
    getSneaker?: SneakerISODate;
  };
}

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const prisma = new PrismaClient({ forceTransactions: true });
  const sneakers = await prisma.sneaker.findMany();

  return {
    fallback: false,
    paths: sneakers.map(sneaker => ({ params: { id: sneaker.id } })),
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params = {},
}) => {
  const prisma = new PrismaClient({ forceTransactions: true });
  const sneaker = await prisma.sneaker.findOne({
    where: { id: params.id as string },
  });

  if (!sneaker) {
    return {
      // because this data is slightly more dynamic, update it every hour
      unstable_revalidate: 60 * 60,
      props: { data: { getSneaker: undefined } },
    };
  }

  const sneakerISODate = {
    ...sneaker,
    purchaseDate: sneaker?.purchaseDate?.toISOString() ?? null,
    soldDate: sneaker?.soldDate?.toISOString() ?? null,
  };

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: { data: { getSneaker: sneakerISODate } },
  };
};

const SneakerPage: NextPage<Props> = ({ data }) => {
  if (!data.getSneaker) return null;
  const title = `${data.getSneaker.model} by ${data.getSneaker.brand} in the ${data.getSneaker.colorway} colorway`;

  return (
    <div className="w-11/12 py-4 mx-auto">
      <NextSeo
        title={title}
        openGraph={{
          title,
          images: [
            {
              url: getCloudinaryURL(data.getSneaker.imagePublicId),
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
            src={getCloudinaryURL(data.getSneaker.imagePublicId)}
            alt={title}
            className="object-contain overflow-hidden rounded-md"
          />
        </div>
        <div>
          <h1 className="text-2xl">
            {data.getSneaker.brand} {data.getSneaker.model}{' '}
            {data.getSneaker.colorway}
          </h1>
          <p className="text-xl">{formatMoney(data.getSneaker?.price)}</p>
          {data.getSneaker.purchaseDate && (
            <p>
              <time className="text-md" dateTime={data.getSneaker.purchaseDate}>
                Purchased {formatDate(data.getSneaker.purchaseDate)}
              </time>
            </p>
          )}

          {data.getSneaker.sold && data.getSneaker.soldDate && (
            <p>
              <time className="text-md" dateTime={data.getSneaker.soldDate}>
                Sold {formatDate(data.getSneaker.soldDate)}{' '}
                {data.getSneaker?.soldPrice && (
                  <>For {formatMoney(data.getSneaker.soldPrice)}</>
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
