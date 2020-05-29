import { NextApiHandlerSession } from './with-session';

export type Method =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';

const withMethods = (
  handler: NextApiHandlerSession,
  methods: Method[]
): NextApiHandlerSession => (req, res) => {
  if (!req.method || !methods.includes(req.method as Method)) {
    res.setHeader('Allow', methods);
    return res.status(405).json({
      error: `Route only accepts ${methods.join(', ')} requests`,
    });
  }

  return handler(req, res);
};

export { withMethods };
