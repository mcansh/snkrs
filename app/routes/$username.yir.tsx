import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { route } from 'routes-gen';
import invariant from 'tiny-invariant';

export let loader: LoaderFunction = ({ params }) => {
  invariant(params.username, 'username is required');
  return redirect(
    route('/:username/yir/:year', {
      username: params.username,
      year: new Date().getFullYear().toString(),
    })
  );
};
