import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Sneaker as SneakerType } from '@prisma/client';
import { SimpleImg } from 'react-simple-img';
import { Formik } from 'formik';
import { useRouter } from 'next/router';
import { dequal } from 'dequal';
import { format } from 'date-fns';
import * as Yup from 'yup';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';
import { useUser } from 'src/hooks/use-user';
import { prisma } from 'prisma/db';
import { useSneaker } from 'src/hooks/use-sneakers';
import { getParams } from 'src/utils/get-params';

const schema = Yup.object().shape({
  model: Yup.string().required(),
  colorway: Yup.string().required(),
  brand: Yup.string().required(),
  size: Yup.number().required().min(1),
  imagePublicId: Yup.string().required(),
  price: Yup.number().required(),
  retailPrice: Yup.number().required(),
  purchaseDate: Yup.date(),
  sold: Yup.boolean().required().default(false),
  soldDate: Yup.date().when('sold', {
    is: sold => sold === true,
    then: Yup.date().required('soldDate is required'),
  }),
  soldPrice: Yup.number().when('sold', {
    is: sold => sold === true,
    then: Yup.number().required('soldPrice is required'),
  }),
});

type Params = {
  id: string;
};

interface Props {
  sneaker:
    | (SneakerType & {
        User: {
          name: string;
        };
      })
    // eslint-disable-next-line @typescript-eslint/ban-types
    | null;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const sneakers = await prisma.sneaker.findMany({ select: { id: true } });

  return {
    fallback: 'unstable_blocking',
    paths: sneakers.map(sneaker => ({ params: { id: sneaker.id } })),
  };
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({
  params,
}) => {
  if (!params) {
    throw new Error('no params!');
  }

  const sneaker = await prisma.sneaker.findOne({
    where: { id: params.id },
    include: { User: { select: { name: true } } },
  });
  return { props: { sneaker }, revalidate: 60 * 60 };
};

const formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS"

const SneakerPage: NextPage<Props> = ({ sneaker }) => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: `/login?continue=${router.asPath}` });
  const { id } = getParams(router.query);
  const { data, error, mutate } = useSneaker(id, sneaker ?? undefined);

  if (!user || user.isLoggedIn === false || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full font-mono text-lg text-center">
        loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-screen-sm mx-auto space-y-2 text-lg text-center">
        <pre>
          Bad news: an error occurred{' '}
          <span role="img" aria-label="sad face">
            😞
          </span>
        </pre>
        <pre>Good news: we&apos;ve been notified and are working on a fix</pre>
      </div>
    );
  }

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`;

  const description = `${sneaker.User.name} bought the ${sneaker.brand} ${
    sneaker.model
  }${
    sneaker.purchaseDate &&
    ` on ${formatDate(sneaker.purchaseDate, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`
  }`;

  const { imagePublicId } = sneaker;
  const image1x = getCloudinaryURL(imagePublicId, { width: 400, crop: 'pad' });
  const image2x = getCloudinaryURL(imagePublicId, { width: 800, crop: 'pad' });
  const image3x = getCloudinaryURL(imagePublicId, { width: 1200, crop: 'pad' });

  return (
    <main className="container min-h-full p-4 mx-auto">
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          title,
          images: [
            { url: image1x, alt: title, width: 400, height: 400 },
            { url: image2x, alt: title, width: 800, height: 800 },
            { url: image3x, alt: title, width: 1200, height: 1200 },
          ],
        }}
      />
      <Link href="/sneakers/[id]" as={`/sneakers/${sneaker.id}`}>
        <a>Back</a>
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <SimpleImg
          src={image1x}
          srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
          alt={title}
          height={200}
          width={200}
          applyAspectRatio
          className="w-full h-full overflow-hidden rounded-md"
        />
        <div>
          <h1 className="text-2xl">{title}</h1>
          <p className="text-xl">{formatMoney(sneaker.price)}</p>
          {sneaker.purchaseDate && (
            <p>
              <time
                className="text-md"
                dateTime={sneaker.purchaseDate.toISOString()}
              >
                Purchased {formatDate(sneaker.purchaseDate)}
              </time>
            </p>
          )}
        </div>
      </div>
      <div>
        <h2 className="py-4 text-lg">Edit Sneaker:</h2>
        <Formik
          validationSchema={schema}
          initialValues={{
            model: sneaker.model,
            colorway: sneaker.colorway,
            brand: sneaker.brand,
            size: sneaker.size,
            imagePublicId: sneaker.imagePublicId,
            price: sneaker.price,
            retailPrice: sneaker.retailPrice,
            purchaseDate: sneaker.purchaseDate
              ? format(sneaker.purchaseDate, formatter)
              : undefined,
            sold: sneaker.sold,
            soldDate: sneaker.soldDate
              ? format(sneaker.soldDate, formatter)
              : undefined,
            soldPrice: sneaker?.soldPrice ?? undefined,
          }}
          onSubmit={async values => {
            const promise = await fetch(`/api/sneakers/${id}/edit`, {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(values),
            });

            mutate({
              ...values,
              id: sneaker.id,
              stockxProductId: sneaker.stockxProductId ?? null,
              purchaseDate: values.purchaseDate
                ? new Date(values.purchaseDate)
                : sneaker.purchaseDate,
              soldDate: values.soldDate
                ? new Date(values.soldDate)
                : sneaker.soldDate,
              soldPrice: values.soldPrice ?? null,
              userId: sneaker.userId,
              User: sneaker.User,
            });

            if (promise.ok) {
              router.push('/sneakers/[id]', `/sneakers/${id}`);
            }
          }}
        >
          {form => {
            const valuesAreEqual = dequal(form.values, {
              model: sneaker.model,
              colorway: sneaker.colorway,
              brand: sneaker.brand,
              size: sneaker.size,
              imagePublicId: sneaker.imagePublicId,
              price: sneaker.price,
              retailPrice: sneaker.retailPrice,
              purchaseDate: sneaker.purchaseDate
                ? format(sneaker.purchaseDate, formatter)
                : undefined,
              sold: sneaker.sold,
              soldDate: sneaker.soldDate
                ? format(sneaker.soldDate, formatter)
                : undefined,
              soldPrice: sneaker.soldPrice,
            });

            return (
              <form className="space-y-4" onSubmit={form.handleSubmit}>
                {form.errors && (
                  <ul className="font-mono text-sm text-red-600 list-disc list-inside">
                    {Object.values(form.errors).map(errorMessage => (
                      <li key={errorMessage}>{errorMessage}</li>
                    ))}
                  </ul>
                )}
                <div className="grid items-center gap-2 sm:grid-cols-2">
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="text"
                    value={form.values.brand}
                    onChange={form.handleChange}
                    placeholder="Brand"
                    name="brand"
                  />
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="text"
                    value={form.values.model}
                    onChange={form.handleChange}
                    placeholder="Model"
                    name="model"
                  />
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="text"
                    value={form.values.colorway}
                    onChange={form.handleChange}
                    placeholder="Colorway"
                    name="colorway"
                  />
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="number"
                    value={form.values.price}
                    onChange={form.handleChange}
                    placeholder="Price"
                    name="price"
                  />
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="number"
                    value={form.values.retailPrice}
                    onChange={form.handleChange}
                    placeholder="Retail Price"
                    name="retailPrice"
                  />
                  <input
                    className="p-1 border-2 border-gray-200 rounded appearance-none"
                    type="datetime-local"
                    value={form.values.purchaseDate}
                    onChange={form.handleChange}
                    placeholder="Purchase Date"
                    name="purchaseDate"
                  />
                  <div
                    className="grid items-center w-full gap-2 sm:grid-cols-2 grid-col"
                    style={{
                      gridColumn: '1/3',
                      paddingTop: !form.values.sold ? 6 : undefined,
                    }}
                  >
                    <label className="flex items-center justify-between">
                      <span className="">Sold?</span>
                      <input
                        type="checkbox"
                        checked={form.values.sold}
                        name="sold"
                        onChange={form.handleChange}
                      />
                    </label>
                    {form.values.sold && (
                      <>
                        <input
                          className="p-1 border-2 border-gray-200 rounded appearance-none"
                          type="datetime-local"
                          value={form.values.soldDate}
                          onChange={form.handleChange}
                          placeholder="Sold Date"
                          name="soldDate"
                        />
                        <input
                          className="p-1 border-2 border-gray-200 rounded appearance-none"
                          type="number"
                          value={form.values.soldPrice ?? sneaker.price}
                          onChange={form.handleChange}
                          placeholder="Sold Price"
                          name="soldPrice"
                        />
                      </>
                    )}
                  </div>
                </div>
                <button
                  disabled={
                    !form.isValid || form.isSubmitting || valuesAreEqual
                  }
                  type="submit"
                  className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
                >
                  Sav{form.isSubmitting ? 'ing' : 'e'} Changes
                </button>
              </form>
            );
          }}
        </Formik>
      </div>
    </main>
  );
};

export default SneakerPage;
