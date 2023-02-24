import * as React from "react";
import type {
  DataFunctionArgs,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { format, parseISO } from "date-fns";
import slugify from "slugify";
import { NumericFormat } from "react-number-format";
import invariant from "tiny-invariant";
import { route } from "routes-gen";

import { formatDate } from "~/utils/format-date";
import { getCloudinaryURL, getImageURLs } from "~/utils/get-cloudinary-url";
import { formatMoney } from "~/utils/format-money";
import { prisma } from "~/db.server";
import { sneakerSchema, url_regex } from "~/lib/schemas/sneaker.server";
import { cloudinary } from "~/lib/cloudinary.server";
import { requireUserId } from "~/session.server";
import { getSeoMeta } from "~/seo";

export let loader = async ({ params, request }: DataFunctionArgs) => {
  invariant(params.sneakerId);
  let userId = await requireUserId(request);

  let sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: {
      user: { select: { familyName: true, givenName: true, id: true } },
      brand: true,
    },
  });

  if (!sneaker) {
    throw new Response(`No sneaker found with id ${params.sneakerId}`, {
      status: 404,
      statusText: "Not Found",
    });
  }

  let userCreatedSneaker = sneaker.user.id === userId;

  if (!userCreatedSneaker) {
    throw new Response("You don't have permission to edit this sneaker", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  return json({
    id: params.sneakerId,
    userCreatedSneaker,
    sneaker: {
      ...sneaker,
      createdAt:
        typeof sneaker.createdAt === "string"
          ? sneaker.createdAt
          : sneaker.createdAt.toISOString(),
      purchaseDate:
        typeof sneaker.purchaseDate === "string"
          ? sneaker.purchaseDate
          : sneaker.purchaseDate.toISOString(),
      soldDate:
        typeof sneaker.soldDate === "string"
          ? sneaker.soldDate
          : sneaker.soldDate?.toISOString(),
    },
  });
};

export let action = async ({ request, params }: DataFunctionArgs) => {
  let userId = await requireUserId(request);
  let { sneakerId } = params;
  invariant(sneakerId);

  let originalSneaker = await prisma.sneaker.findUnique({
    where: { id: sneakerId },
    select: {
      userId: true,
      imagePublicId: true,
    },
  });

  if (!originalSneaker) {
    throw new Response(`No sneaker found with id ${sneakerId}`, {
      status: 404,
      statusText: "Not Found",
    });
  }

  if (originalSneaker.userId !== userId) {
    throw new Response("You don't have permission to edit this sneaker", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  let formData = await request.formData();
  let valid = sneakerSchema.safeParse(formData);

  if (!valid.success) {
    return json({ errors: valid.error.flatten().fieldErrors }, { status: 422 });
  }

  let imagePublicId = originalSneaker.imagePublicId;
  if (originalSneaker.imagePublicId !== valid.data.imagePublicId) {
    // image was already uploaded to our cloudinary bucket
    if (valid.data.imagePublicId.startsWith("shoes/")) {
      imagePublicId = valid.data.imagePublicId;
    } else if (url_regex.test(valid.data.imagePublicId)) {
      // image is an url to an external image and we need to send it off to cloudinary to add it to our bucket
      let res = await cloudinary.v2.uploader.upload(valid.data.imagePublicId, {
        resource_type: "image",
        folder: "shoes",
      });

      imagePublicId = res.public_id;
    }
  }

  await prisma.sneaker.update({
    where: { id: sneakerId },
    data: {
      brand: {
        connectOrCreate: {
          create: {
            name: valid.data.brand,
            slug: slugify(valid.data.brand, { lower: true }),
          },
          where: { slug: slugify(valid.data.brand, { lower: true }) },
        },
      },
      colorway: valid.data.colorway,
      imagePublicId,
      model: valid.data.model,
      price: valid.data.price,
      purchaseDate: valid.data.purchaseDate,
      retailPrice: valid.data.retailPrice,
      size: valid.data.size,
    },
  });

  return redirect(request.url);
};

export let meta: MetaFunction = ({
  data,
}: {
  data?: SerializeFrom<typeof loader> | undefined;
}) => {
  if (!data?.sneaker) {
    return getSeoMeta();
  }

  return getSeoMeta({
    title: `Editing ${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`,
  });
};

let formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

export default function EditSneakerPage() {
  let location = useLocation();
  let { sneaker } = useLoaderData<typeof loader>();
  let navigation = useNavigation();
  let actionData = useActionData<typeof action>();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";

  let title = `Editing ${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;

  let srcSet = getImageURLs(sneaker.imagePublicId);

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link
        prefetch="intent"
        to={route("/sneakers/:sneakerId", { sneakerId: sneaker.id })}
      >
        Back
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative pb-[100%]">
          <img
            src={getCloudinaryURL(sneaker.imagePublicId, {
              resize: { width: 200, height: 200, type: "pad" },
            })}
            sizes="(min-width: 640px) 50vw, 100vw"
            srcSet={srcSet}
            alt={title}
            height={1200}
            width={1200}
            className="absolute inset-0 overflow-hidden rounded-md"
            loading="lazy"
          />
        </div>
        <div>
          <h1 className="text-2xl">{title}</h1>
          <p className="text-xl">{formatMoney(sneaker.price)}</p>
          <p>
            <time
              className="text-md"
              dateTime={new Date(sneaker.purchaseDate).toISOString()}
            >
              Purchased {formatDate(sneaker.purchaseDate)}
            </time>
          </p>
        </div>
      </div>
      <div>
        <h2 className="py-4 text-lg">Edit Sneaker:</h2>
        {actionData?.errors ? (
          <div className="p-4 mb-4 text-white bg-red-500 rounded">
            <ul className="list-disc list-inside">
              {Object.entries(actionData.errors).map(
                ([errorKey, errorValue]) => (
                  <li key={`${errorKey}-${errorValue}`}>
                    {errorKey}: {errorValue}
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
        <Form method="post">
          <fieldset
            disabled={pendingForm}
            className="pb-4 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2"
          >
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.brand.name}
              placeholder="Brand"
              name="brand"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.model}
              placeholder="Model"
              name="model"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.colorway}
              placeholder="Colorway"
              name="colorway"
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="number"
              defaultValue={sneaker.size}
              placeholder="Size"
              name="size"
              step={0.5}
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="text"
              defaultValue={sneaker.imagePublicId}
              placeholder="shoes/..."
              name="imagePublicId"
            />
            <NumericFormat
              name="price"
              placeholder="Price"
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              prefix="$"
              defaultValue={sneaker.price / 100}
            />
            <NumericFormat
              name="retailPrice"
              placeholder="Retail Price"
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              prefix="$"
              defaultValue={sneaker.retailPrice / 100}
            />
            <input
              className="w-full p-1 border-2 border-gray-200 rounded appearance-none"
              type="datetime-local"
              defaultValue={format(parseISO(sneaker.purchaseDate), formatter)}
              placeholder="Purchase Date"
              name="purchaseDate"
            />
            <button
              type="submit"
              className="self-start w-auto px-4 py-2 text-center text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed sm:col-span-2"
            >
              Sav{pendingForm ? "ing" : "e"} Changes
            </button>
          </fieldset>
        </Form>
      </div>
    </main>
  );
}
