export let DEFAULT_TITLE = 'Snkrs';

export function createTitle(title?: string | undefined) {
  if (!title) return DEFAULT_TITLE;
  return `${title} | ${DEFAULT_TITLE}`;
}
