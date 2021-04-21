export type Flash =
  | { message: string; type: 'success' | 'error' | 'info' }
  | string;
