import type { useMatches } from 'remix';
import type { TypeOf, ZodType } from 'zod';

export type Maybe<T> = T | null | undefined;

export interface RouteHandle {
  bodyClassName?: string;
}

export type Match = Omit<ReturnType<typeof useMatches>, 'handle'> & {
  handle?: RouteHandle;
};
