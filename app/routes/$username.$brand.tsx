import type { LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

export let loader = ({ params }: LoaderArgs) => {
  return redirect(`/${params.username}?brand=${params.brand}`);
};
