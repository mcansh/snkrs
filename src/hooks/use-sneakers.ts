import useSWR from 'swr';
import type { Sneaker as SneakerType, User as UserType } from '@prisma/client';

import { superFetcher } from 'src/lib/fetcher';

interface SneakerTypeWithUser extends SneakerType {
  User: {
    name: UserType['name'];
  };
}

function useSneaker(id?: string, initialData?: SneakerTypeWithUser) {
  return useSWR<SneakerTypeWithUser, Error>(id ? `/api/sneakers/${id}` : null, {
    initialData,
    fetcher: superFetcher,
  });
}

function useSneakerYear(year: number, initialData?: SneakerTypeWithUser[]) {
  return useSWR<SneakerTypeWithUser[], Error>(`/api/sneakers/${year}`, {
    initialData,
    fetcher: superFetcher,
  });
}

function useUserSneakers(username: string, initialData?: SneakerType[]) {
  return useSWR<SneakerType[], Error>(`/api/${username}`, {
    initialData,
    fetcher: superFetcher,
  });
}

export { useSneaker, useSneakerYear, useUserSneakers };
