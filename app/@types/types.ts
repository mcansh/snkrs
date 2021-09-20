export type Flash =
  | string
  | { message: string; type: 'error' | 'info' | 'success' };

export type Maybe<T> = T | null | undefined;

type RemoveIndex<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
    ? never
    : P]: T[P];
};

export { RemoveIndex };
