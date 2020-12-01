import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

const loader: Loader = async ({ session }) => {
  await session.destroy();
  return redirect('/');
};

export { loader };
