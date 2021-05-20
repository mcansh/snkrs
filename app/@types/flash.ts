export type Flash =
  | string
  | { message: string; type: 'error' | 'info' | 'success' };
