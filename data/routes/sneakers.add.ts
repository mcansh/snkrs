import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { flashMessage } from '../flash-message';

const loader: Loader = ({ session }) => {
  const userId = session.get(sessionKey);
  if (!userId) {
    session.flash(
      flashMessageKey,
      flashMessage('Authentication Required', 'error')
    );
    session.set(redirectKey, `/sneakers/add`);
    return redirect(`/login`);
  }

  return new Response(null, { status: 200 });
};

const action: Action = async ({ request, session, context }) => {
  const { prisma } = context as Context;
  const formData = (await parseFormBody(request)) as FormData;

  const userId = session.get(sessionKey);

  if (!userId) {
    session.flash(
      flashMessageKey,
      flashMessage('Authentication Required', 'error')
    );
    session.set(redirectKey, `/sneakers/add`);
    return redirect(`/login`);
  }

  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;
  const colorway = formData.get('colorway') as string;
  const price = parseInt(formData.get('price') as string, 10);
  const retailPrice = parseInt(formData.get('retailPrice') as string, 10);
  const purchaseDate = new Date();
  const size = parseInt(formData.get('size') as string, 10);

  const sneaker = await prisma.sneaker.create({
    data: {
      User: { connect: { id: userId } },
      brand,
      colorway,
      model,
      price,
      purchaseDate,
      retailPrice,
      size,
      imagePublicId: '',
    },
  });

  return redirect(`/sneakers/${sneaker.id}`);
};

export { loader, action };
