import { redirect } from 'remix';

import { destroySession, getSession } from '../session';

import type { LoaderFunction } from 'remix';

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  return redirect('/login', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
};

const LogoutPage = () => null;

export default LogoutPage;
export { loader };
