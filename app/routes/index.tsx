import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { flashMessageKey, sessionKey } from '../constants';
import { prisma } from '../db';
import { flashMessage } from '../flash-message';
import { commitSession, getSession } from '../session';

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get(sessionKey);

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      return redirect(`/${user.username}`);
    }

    session.flash(flashMessageKey, flashMessage('User not found', 'error'));
    return redirect(`/loganmcansh`, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  return redirect(`/loganmcansh`);
};

const IndexPage = () => null;

export default IndexPage;
export { loader };
