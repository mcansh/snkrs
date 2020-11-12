import React from 'react';
import type { GetStaticProps, NextPage, GetStaticPaths } from 'next';

import type { SneakerYearProps } from 'src/components/sneaker-year';
import { SneakerYear } from 'src/components/sneaker-year';
import { getYearInSneakers } from 'src/lib/get-sneakers-for-year';
import { prisma } from 'prisma/db';

export const getStaticPaths: GetStaticPaths = async () => {
  const sneakers = await prisma.sneaker.findMany();
  const allYears = sneakers
    .map(sneaker => sneaker.purchaseDate.getFullYear())
    .filter(Boolean);

  const years = [...new Set(allYears)];

  return {
    fallback: 'blocking',
    paths: years.map(year => ({
      params: { year: String(year) },
    })),
  };
};

export const getStaticProps: GetStaticProps<SneakerYearProps> = async ({
  params = {},
}) => {
  const year = parseInt(params.year as string, 10);
  const sneakers = await getYearInSneakers(year);

  return {
    // because this data is slightly more dynamic, update it every hour
    revalidate: 60 * 60,
    props: { sneakers, year },
  };
};

const SneakersYearInReview: NextPage<SneakerYearProps> = ({
  year,
  sneakers,
}) => <SneakerYear year={year} sneakers={sneakers} />;

export default SneakersYearInReview;
