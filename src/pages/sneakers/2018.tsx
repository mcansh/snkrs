import React from 'react';
import { GetStaticProps, NextPage } from 'next';

import { SneakerYear, SneakerYearProps } from 'src/components/sneaker-year';
import { getYearInSneakers } from 'src/lib/get-sneakers-for-year';

export const getStaticProps: GetStaticProps<SneakerYearProps> = async () => {
  const year = 2018;
  const sneakers = await getYearInSneakers(year);

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: { sneakers, year },
  };
};

const Sneakers2018: NextPage<SneakerYearProps> = ({ year, sneakers }) => (
  <SneakerYear year={year} sneakers={sneakers} />
);

export default Sneakers2018;
