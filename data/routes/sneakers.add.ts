import type { Action, Loader } from '@remix-run/data';
import { parseFormBody, redirect } from '@remix-run/data';

import { flashMessageKey, redirectKey, sessionKey } from '../constants';
import type { Context } from '../db';
import { AuthorizationError } from '../errors';
import { flashMessage } from '../flash-message';

const loader: Loader = ({ session }) => {
  const userId = session.get(sessionKey);
  try {
    if (!userId) {
      throw new AuthorizationError();
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
    }
    return redirect(`/login`);
  }
};

const action: Action = async ({ request, session, context }) => {
  const { prisma } = context as Context;

  try {
    const formData = (await parseFormBody(request)) as FormData;

    const userId = session.get(sessionKey);

    if (!userId) {
      throw new AuthorizationError();
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
  } catch (error) {
    if (error instanceof AuthorizationError) {
      session.flash(flashMessageKey, flashMessage(error.message, 'error'));
      session.set(redirectKey, `/sneakers/add`);
    }
    return redirect(`/login`);
  }
};

export { loader, action };
