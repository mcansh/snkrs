import type { ActionFunction, LoaderFunction, Session } from 'remix';
import { json } from 'remix';

import { commitSession, getSession } from '../session';

export async function withSession(
  request: Request,
  next: (
    session: Session
  ) => ReturnType<ActionFunction> | ReturnType<LoaderFunction>
) {
  const session = await getSession(request.headers.get('Cookie'));

  // pass the session to the loader/action and let it handle the response
  let response: Response = await next(session);

  // if they returned a plain object, turn it into a response
  if (!(response instanceof Response)) {
    response = json(response);
  }

  // commit the session automatically
  response.headers.append('Set-Cookie', await commitSession(session));

  return response;
}
