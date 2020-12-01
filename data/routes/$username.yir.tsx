import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

const loader: Loader = ({ params: { username } }) => {
  const currentYear = new Date().getFullYear();

  return redirect(`/${username}/yir/${currentYear}`);
};

export { loader };
