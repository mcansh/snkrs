import useSWR from 'swr';
import { Sneaker as SneakerType } from '@prisma/client';

function useSneaker(id?: string, initialData?: SneakerType) {
  return useSWR<SneakerType>(() => `/api/sneakers/${id}`, {
    initialData,
  });
}

export { useSneaker };
