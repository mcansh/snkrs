// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import type { IncomingMessage, ServerResponse } from 'http';

import type { Session, SessionOptions } from 'next-iron-session';
import {
  withIronSession,
  applySession as applyIronSession,
} from 'next-iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface NextApiRequestSession extends NextApiRequest {
  session: Session;
}

export interface ServerRequestSession extends IncomingMessage {
  session: Session;
}

const sessionOptions: SessionOptions = {
  password: [
    {
      id: 2,
      password: process.env.SESSION_PASSWORD,
    },
    {
      id: 1,
      password: 'ucmj4ir-I5JDbl2yJMPQ1C633dn4tE7a',
    },
  ],
  cookieName: 'sid',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
  },
};

export type NextApiHandlerSession<T = any> = (
  req: NextApiRequestSession,
  res: NextApiResponse<T>
) => void | Promise<void>;

const withSession = (handler: NextApiHandlerSession) =>
  withIronSession(handler, sessionOptions);

const applySession = (req: IncomingMessage, res: ServerResponse) =>
  applyIronSession(req, res, sessionOptions);

export { withSession, applySession };
