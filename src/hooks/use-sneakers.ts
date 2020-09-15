import useSWR from 'swr';
import { Sneaker as SneakerType } from '@prisma/client';

import { superFetcher } from 'src/lib/fetcher';

function useSneaker(id?: string, initialData?: SneakerType) {
  return useSWR<SneakerType>(() => `/api/sneakers/${id}`, {
    initialData,
    fetcher: superFetcher,
  });
}

function useSneakerYear(year: number, initialData?: SneakerType[]) {
  return useSWR<SneakerType[]>(`/api/sneakers/${year}`, {
    initialData,
    fetcher: superFetcher,
  });
}

function useUserSneakers(username: string, initialData?: SneakerType[]) {
  return useSWR<SneakerType[]>(`/api/${username}/sneakers`, {
    initialData,
    fetcher: superFetcher,
  });
}

export { useSneaker, useSneakerYear, useUserSneakers };
