import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { flashMessage } from '../flash-message';

const loader: Loader = async ({ params, session, context }) => {
  const { prisma } = context as Context;
  const sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: { User: { select: { name: true, id: true, username: true } } },
  });

  const userCreatedSneaker = sneaker?.User.id === session.get(sessionKey);

  const body = JSON.stringify({
    sneaker,
    id: params.sneakerId,
    userCreatedSneaker,
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control':
        'max-age=300, s-maxage=600, stale-while-revalidate=31536000',
    },
  });
};

const action: Action = async ({ request, params, session, context }) => {
  const { prisma } = context as Context;
  const userId = session.get(sessionKey);
  const { sneakerId } = params;
  const body = await parseFormBody(request);

  if (!userId) {
    session.set(redirectKey, `/sneakers/${sneakerId}`);
    session.flash(
      flashMessageKey,
      flashMessage('Authentication Required', 'error')
    );
    return redirect(`/login`);
  }

  // const sneaker = await prisma.sneaker.findUnique({
  //   where: { id },
  // });

  // if (!sneaker) {
  //   return res.status(404).json({ error: 'No sneaker with that id' });
  // }

  // if (sneaker.userId !== userId) {
  //   return res.status(401).json({ error: "you don't own that sneaker" });
  // }

  const bodyObj = Object.fromEntries(body);

  const purchaseDate = bodyObj.purchaseDate
    ? new Date(bodyObj.purchaseDate as string)
    : undefined;

  const soldDate = bodyObj.soldDate
    ? new Date(bodyObj.soldDate as string)
    : undefined;

  const price = bodyObj.price
    ? parseInt(bodyObj.price as string, 10)
    : undefined;

  const retailPrice = bodyObj.retailPrice
    ? parseInt(bodyObj.retailPrice as string, 10)
    : undefined;

  const soldPrice = bodyObj.soldPrice
    ? parseInt(bodyObj.soldPrice as string, 10)
    : undefined;

  await prisma.sneaker.update({
    where: { id: sneakerId },
    data: { ...bodyObj, soldDate, purchaseDate, price, retailPrice, soldPrice },
  });

  session.flash(
    flashMessageKey,
    flashMessage(`Updated ${sneakerId}`, 'success')
  );

  return redirect(`/sneakers/${sneakerId}`);
};

export { loader, action };
