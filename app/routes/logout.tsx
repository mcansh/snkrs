import type { Loader } from '@remix-run/data';
import { redirect } from '@remix-run/data';

import { flashMessageKey, sessionKey } from '../constants';
import { flashMessage } from '../flash-message';

const loader: Loader = ({ session }) => {
  session.unset(sessionKey);
  session.flash(flashMessageKey, flashMessage('See ya later ✌️', 'info'));
  return redirect('/');
};

const LogoutPage = () => null;

export default LogoutPage;
export { loader };
