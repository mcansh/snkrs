import type { useMatches } from 'remix';

export type Flash =
  | string
  | { message: string; type: 'error' | 'info' | 'success' };

export type Maybe<T> = T | null | undefined;

export type RemoveIndex<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
    ? never
    : P]: T[P];
};

export interface RouteHandle {
  bodyClassName?: string;
}

export type Match = Omit<ReturnType<typeof useMatches>, 'handle'> & {
  handle?: RouteHandle;
};
