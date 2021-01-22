import type { Loader } from '@remix-run/data';

import { flashMessageKey } from './constants';

function safelyParseJSON(input: string) {
  try {
    return JSON.parse(input);
  } catch (error) {
    return undefined;
  }
}

const loader: Loader = ({ session }) => {
  const flash = session.get(flashMessageKey);

  if (flash) {
    const json = safelyParseJSON(flash);
    return { flash: json };
  }
  return { flash: undefined };
};

export { loader };
