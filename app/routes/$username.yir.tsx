import { redirect } from 'remix';
import type { LoaderFunction } from 'remix';
import { route } from 'routes-gen';
import invariant from 'tiny-invariant';

export let loader: LoaderFunction = ({ params }) => {
  invariant(params.username, 'username is required');
  let currentYear = new Date().getFullYear();
  return redirect(
    route('/:username/yir/:year', {
      username: params.username,
      year: currentYear.toString(),
    })
  );
};
