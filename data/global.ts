import type { Loader } from '@remix-run/data';

const loader: Loader = ({ session }) => {
  const flash = session.get('globalMessage');
  try {
    if (flash) {
      const json = JSON.parse(flash);
      return { flash: json };
    }
  } catch (error) {
    // flash message wasn't json, probably just a string
    return { flash };
  }
  return { flash };
};

export { loader };
