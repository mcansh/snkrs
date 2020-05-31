import React from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';

import { applySession, ServerRequestSession } from 'src/utils/with-session';
import { redirect } from 'src/utils/redirect';
import { prisma } from 'prisma/db';
import { createSneakerSchema } from 'src/lib/schemas/sneaker';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  await applySession(req, res);

  const userId = (req as ServerRequestSession).session.get('userId');

  if (!userId) {
    const continuePath = req.url;
    return redirect(res, `/login?continue=${continuePath}`);
  }

  const user = prisma.user.findOne({ where: { id: userId } });

  if (!user) {
    const continuePath = req.url;
    return redirect(res, `/login?continue=${continuePath}`);
  }

  return { props: {} };
};

const NewSneaker: NextPage = () => {
  const router = useRouter();
  const form = useFormik({
    validationSchema: createSneakerSchema,
    initialValues: {
      model: '',
      colorway: '',
      brand: '',
      size: '',
      imagePublicId: '',
      price: '',
      retailPrice: '',
      purchaseDate: '',
    },
    initialErrors: {
      model: '',
      colorway: '',
      brand: '',
      size: '',
      imagePublicId: '',
      price: '',
      retailPrice: '',
      purchaseDate: '',
    },
    onSubmit: async values => {
      const promise = await fetch(`/api/sneakers/create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (promise.ok) {
        const data = await promise.json();
        router.push('/sneakers/[id]', `/sneakers/${data.id}`);
      }
    },
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit}>
      <fieldset disabled={form.isSubmitting} className="space-y-4">
        <div className="grid items-start gap-2 sm:grid-cols-2">
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="text"
            value={form.values.brand}
            onChange={form.handleChange}
            placeholder="Brand"
            name="brand"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="text"
            value={form.values.model}
            onChange={form.handleChange}
            placeholder="Model"
            name="model"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="text"
            value={form.values.colorway}
            onChange={form.handleChange}
            placeholder="Colorway"
            name="colorway"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="number"
            value={form.values.price}
            onChange={form.handleChange}
            placeholder="Price"
            name="price"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="number"
            value={form.values.retailPrice}
            onChange={form.handleChange}
            placeholder="Retail Price"
            name="retailPrice"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="datetime-local"
            value={form.values.purchaseDate}
            onChange={form.handleChange}
            placeholder="Purchase Date"
            name="purchaseDate"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="number"
            value={form.values.size}
            onChange={form.handleChange}
            placeholder="Size"
            name="size"
          />
          <input
            className="p-1 border border-2 border-gray-200 rounded appearance-none"
            type="text"
            value={form.values.imagePublicId}
            onChange={form.handleChange}
            placeholder="imagePublicId"
            name="imagePublicId"
          />
        </div>
      </fieldset>
      <button
        disabled={!form.isValid || form.isSubmitting}
        type="submit"
        className="w-full p-1 text-white bg-blue-500 border border-2 border-gray-200 rounded sm:w-auto disabled:bg-blue-200 disabled:cursor-not-allowed"
      >
        Sav{form.isSubmitting ? 'ing' : 'e'} Sneaker
      </button>
    </form>
  );
};

export default NewSneaker;
