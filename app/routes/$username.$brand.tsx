import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

export let loader: LoaderFunction = ({ params }) => {
  return redirect(`/${params.username}?brand=${params.brand}`);
};
