import type { NextApiHandlerSession } from 'src/utils/with-session';
import { withSession } from 'src/utils/with-session';
import { withMethods } from 'src/utils/with-methods';

const handler: NextApiHandlerSession = (req, res) => {
  req.session.destroy();
  res.json({ message: 'successfully logged out', isLoggedIn: false });
};

export default withSession(withMethods(handler, ['POST', 'GET']));
