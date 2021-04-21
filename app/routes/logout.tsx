import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { destroySession, getSession } from '../session';

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
};

const LogoutPage = () => null;

export default LogoutPage;
export { loader };
