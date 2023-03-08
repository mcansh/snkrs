import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { format, parseISO } from "date-fns";
import slugify from "slugify";
import { NumericFormat } from "react-number-format";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";
import { sneakerSchema, url_regex } from "~/lib/schemas/sneaker.server";
import { cloudinary } from "~/lib/cloudinary.server";
import { requireUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";

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
    sneaker,
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

export let meta: V2_MetaFunction = mergeMeta<typeof loader>(({ data }) => {
  return [
    {
      title: getPageTitle(
        `Editing ${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`
      ),
    },
  ];
});

let formatter = "yyyy-MM-dd'T'HH:mm:ss.SSS";

export default function EditSneakerPage() {
  let location = useLocation();
  let { sneaker } = useLoaderData<typeof loader>();
  let navigation = useNavigation();
  let actionData = useActionData<typeof action>();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";

  return (
    <>
      <div>
        <h2 className="py-4 text-lg">Edit Sneaker:</h2>
        {actionData?.errors ? (
          <div className="mb-4 rounded bg-red-500 p-4 text-white">
            <ul className="list-inside list-disc">
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
            className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0"
          >
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="text"
              defaultValue={sneaker.brand.name}
              placeholder="Brand"
              name="brand"
            />
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="text"
              defaultValue={sneaker.model}
              placeholder="Model"
              name="model"
            />
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="text"
              defaultValue={sneaker.colorway}
              placeholder="Colorway"
              name="colorway"
            />
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="number"
              defaultValue={sneaker.size}
              placeholder="Size"
              name="size"
              step={0.5}
            />
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="text"
              defaultValue={sneaker.imagePublicId}
              placeholder="shoes/..."
              name="imagePublicId"
            />
            <NumericFormat
              name="price"
              placeholder="Price"
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              prefix="$"
              defaultValue={sneaker.price / 100}
            />
            <NumericFormat
              name="retailPrice"
              placeholder="Retail Price"
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              prefix="$"
              defaultValue={sneaker.retailPrice / 100}
            />
            <input
              className="w-full appearance-none rounded border-2 border-gray-200 p-1"
              type="datetime-local"
              defaultValue={format(parseISO(sneaker.purchaseDate), formatter)}
              placeholder="Purchase Date"
              name="purchaseDate"
            />
            <button
              type="submit"
              className="w-auto self-start rounded bg-blue-500 px-4 py-2 text-center text-white disabled:cursor-not-allowed disabled:bg-blue-200 sm:col-span-2"
            >
              Sav{pendingForm ? "ing" : "e"} Changes
            </button>
          </fieldset>
        </Form>
      </div>
    </>
  );
}
