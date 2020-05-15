// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import { withIronSession, Session } from 'next-iron-session';
import { NextApiRequest, NextApiResponse } from 'next';

export interface NextApiRequestSession extends NextApiRequest {
  session: Session;
}

export type NextApiHandlerSession<T = any> = (
  req: NextApiRequestSession,
  res: NextApiResponse<T>
) => void | Promise<void>;

const withSession = (handler: NextApiHandlerSession) =>
  withIronSession(handler, {
    // The password in this example is in plain text (inside `now.json`) for ease of deployment and understanding.
    // ⚠️ Do not reuse the same password, create a different password for you and store it in a secret management system
    // Example for Vercel: https://vercel.com/docs/v2/serverless-functions/env-and-secrets
    password: 'ucmj4ir-I5JDbl2yJMPQ1C633dn4tE7a',
    cookieName: 'sid',
    cookieOptions: {
      // the next line allows to use the session in non-https environements like
      // Next.js dev mode (http://localhost:3000)
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
    },
  });

export { withSession };
