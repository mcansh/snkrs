import React from 'react';
import Router from 'next/router';
import useSWR from 'swr';

import { UserResponse } from 'src/pages/api/user';

interface Options {
  redirectTo?: string;
  redirectIfFound?: string;
}

function useUser({ redirectTo, redirectIfFound }: Options = {}) {
  const { data: user, mutate: mutateUser } = useSWR<UserResponse>('/api/user');

  React.useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user?.isLoggedIn)
    ) {
      Router.push(redirectTo);
    }
  }, [user, redirectIfFound, redirectTo]);

  return { user, mutateUser };
}

export { useUser };
