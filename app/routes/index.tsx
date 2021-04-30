import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';

import { flashMessageKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { flashMessage } from '../flash-message';
import { withSession } from '../lib/with-session';

const loader: LoaderFunction = ({ request }) =>
  withSession(request, async session => {
    const userId = session.get(sessionKey);

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user) {
        return redirect(`/${user.username}`);
      }

      session.flash(flashMessageKey, flashMessage('User not found', 'error'));
      return redirect(`/loganmcansh`);
    }

    return redirect(`/loganmcansh`);
  });

const IndexPage = () => null;

export default IndexPage;
export { loader };
