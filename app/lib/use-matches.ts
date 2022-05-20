import { useMatches as useRemixMatches } from '@remix-run/react';

export interface RouteHandle {
  bodyClassName?: string;
}

export type Match = Omit<
  ReturnType<typeof useRemixMatches>,
  'handle'
>[number] & {
  handle?: RouteHandle;
};

export function useMatches(): Array<Match> {
  return useRemixMatches() as Array<Match>;
}
