import React from 'react';
import { NextPage } from 'next';
import useSWR from 'swr';
import Router from 'next/router';
import Link from 'next/link';

const Logout: NextPage = () => {
  const { data, error } = useSWR('/api/logout');

  React.useEffect(() => {
    if (data?.message) Router.replace('/');
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        if you&apos; not automatically redirected,{' '}
        <Link href="/api/logout" prefetch={false}>
          <a>click here</a>
        </Link>
      </div>
    );
  }

  return null;
};

export default Logout;
