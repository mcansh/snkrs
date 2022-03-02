import { redirect } from 'remix';
import type { LoaderFunction } from 'remix';

export let loader: LoaderFunction = ({ params: { username } }) => {
  let currentYear = new Date().getFullYear();

  return redirect(`/${username}/yir/${currentYear}`);
};
