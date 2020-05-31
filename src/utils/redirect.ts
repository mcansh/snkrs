import { ServerResponse } from 'http';

function redirect(res: ServerResponse, path: string) {
  res.setHeader('location', path);
  res.statusCode = 302;
  res.end();
  return { props: {} };
}

export { redirect };
