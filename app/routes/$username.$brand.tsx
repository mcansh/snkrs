import { redirect } from 'remix';
import type { LoaderFunction } from 'remix';

export let loader: LoaderFunction = ({ params }) => {
  return redirect(`/${params.username}?brand=${params.brand}`);
};
