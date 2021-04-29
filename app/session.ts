import { createCookieSessionStorage } from 'remix';

const {
  getSession,
  commitSession,
  destroySession,
} = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secrets: [process.env.SESSION_PASSWORD],
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
});

export { getSession, commitSession, destroySession };
