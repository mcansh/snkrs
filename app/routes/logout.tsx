import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { flashMessageKey, sessionKey } from '../constants';
import { flashMessage } from '../flash-message';
import { commitSession, getSession } from '../session';

const loader: Loader = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  session.unset(sessionKey);
  session.flash(flashMessageKey, flashMessage('See ya later ✌️', 'info'));
  return redirect('/', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
};

const LogoutPage = () => null;

export default LogoutPage;
export { loader };
