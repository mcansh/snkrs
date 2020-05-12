import React from 'react';
import { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Sneaker } from '@prisma/client';
import { NormalizedCacheObject } from '@apollo/client';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';
import { initApolloClient } from 'src/graphql/apollo';
import {
  GetSneakersDocument,
  GetSneakerDocument,
  useGetSneakerQuery,
} from 'src/graphql/generated';
import { withApollo } from 'src/components/with-apollo';

export const getStaticPaths: GetStaticPaths = async () => {
  const client = initApolloClient();
  const response = await client.query({ query: GetSneakersDocument });
  return {
    fallback: true,
    paths: response.data.getSneakers.map((sneaker: Sneaker) => ({
      params: { id: sneaker.id },
    })),
  };
};

export const getStaticProps: GetStaticProps<{
  apolloStaticCache: NormalizedCacheObject;
}> = async ({ params = {} }) => {
  const client = initApolloClient();
  await client.query({
    query: GetSneakerDocument,
    variables: { id: params.id },
  });
  /*
     Because this is using withApollo, the data from this query will be
     pre-populated in the Apollo cache at build time. When the user first
     visits this page, we can retrieve the data from the cache like this:
     const { data } = useGetSneakerQuery({ fetchPolicy: 'cache-and-network' })
     This preserves the ability for the page to render all bookmarks instantly,
     then get progressively updated if any new bookmarks come in over the wire.
   */
  const apolloStaticCache = client.cache.extract();

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: { id: params.id, apolloStaticCache },
  };
};

const SneakerPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = useGetSneakerQuery({
    fetchPolicy: 'cache-and-network',
    variables: { id },
  });
  if (!data) return <p>Loading...</p>;
  if (!data.getSneaker) return <p>no sneaker for id &quot;{id}&quot;</p>;

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

export default withApollo(SneakerPage);
