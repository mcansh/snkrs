import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import slugify from "slugify";
import { NumericFormat } from "react-number-format";
import { $path } from "remix-routes";
import { parse } from "@conform-to/zod";

import { prisma } from "~/db.server";
import { cloudinary } from "~/lib/cloudinary.server";
import { sneakerSchema, url_regex } from "~/lib/schemas/sneaker.server";
import { requireUserId } from "~/session.server";
import { getPageTitle, mergeMeta } from "~/meta";

export let meta: MetaFunction = mergeMeta(() => {
  return [{ title: getPageTitle("Add a sneaker to your collection") }];
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return json(null);
}

export async function action({ request }: ActionFunctionArgs) {
  let userId = await requireUserId(request);
  let formData = await request.formData();

  let submission = parse(formData, { schema: sneakerSchema });

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }

  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 422 });
  }

  let imagePublicId = "";
  if (submission.value.imagePublicId) {
    // image was already uploaded to our cloudinary bucket
    if (submission.value.imagePublicId.startsWith("shoes/")) {
      imagePublicId = submission.value.imagePublicId;
    } else if (url_regex.test(submission.value.imagePublicId)) {
      // image is an url to an external image and we need to send it off to cloudinary to add it to our bucket
      let res = await cloudinary.v2.uploader.upload(
        submission.value.imagePublicId,
        {
          resource_type: "image",
          folder: "shoes",
        },
      );

      imagePublicId = res.public_id;
    } else {
      // no image provided
    }
  }

  let sneaker = await prisma.sneaker.create({
    data: {
      user: { connect: { id: userId } },
      brand: {
        connectOrCreate: {
          where: {
            name: submission.value.brand,
          },
          create: {
            name: submission.value.brand,
            slug: slugify(submission.value.brand, { lower: true }),
          },
        },
      },
      colorway: submission.value.colorway,
      model: submission.value.model,
      price: submission.value.price,
      purchaseDate: submission.value.purchaseDate.toISOString(),
      retailPrice: submission.value.retailPrice,
      size: submission.value.size,
      imagePublicId,
    },
    include: { user: { select: { username: true } }, brand: true },
  });

  return redirect($path("/sneakers/:sneakerId", { sneakerId: sneaker.id }));
}

export default function NewSneakerPage() {
  let location = useLocation();
  let navigation = useNavigation();
  let pendingForm =
    navigation.formAction === location.pathname &&
    navigation.state === "submitting";
  let actionData = useActionData<typeof action>();

  return (
    <main className="container mx-auto h-full p-4 pb-6">
      <h2 className="py-4 text-lg">Add a sneaker to your collection</h2>
      {actionData?.submission.error ? (
        <div className="mb-4 rounded bg-red-500 p-4 text-white">
          <ul className="list-inside list-disc">
            {Object.entries(actionData.submission.error).map(
              ([errorKey, errorValue]) => (
                <li key={`${errorKey}-${errorValue}`}>
                  {errorKey}: {errorValue}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
      <Form method="post">
        <fieldset
          disabled={pendingForm}
          className="w-full space-y-2 sm:grid sm:grid-cols-2 sm:items-center sm:gap-x-4 sm:gap-y-6 sm:space-y-0"
        >
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Brand
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="text"
              placeholder="Nike"
              name="brand"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Model
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="text"
              placeholder="Air Max 1"
              name="model"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Colorway
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="text"
              placeholder="Anniversary Royal"
              name="colorway"
            />
          </label>
          <label htmlFor="price">
            <span className="block text-sm font-medium text-gray-700">
              Price (in cents)
            </span>
            <NumericFormat
              id="price"
              name="price"
              placeholder="12000"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              prefix="$"
            />
          </label>
          <label htmlFor="retailPrice">
            <span className="block text-sm font-medium text-gray-700">
              Retail Price
            </span>
            <NumericFormat
              id="retailPrice"
              name="retailPrice"
              placeholder="12000"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              prefix="$"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Purchase Date
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="datetime-local"
              name="purchaseDate"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Size
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="number"
              placeholder="10"
              name="size"
              step={0.5}
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Image
            </span>
            <input
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              type="text"
              name="imagePublicId"
              placeholder="1200x1200 photo or cloudinary publicId"
            />
          </label>
          <button
            type="submit"
            className="col-span-2 w-auto self-start rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-left text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-200"
          >
            Add{pendingForm ? "ing" : ""} to collection
          </button>
        </fieldset>
      </Form>
    </main>
  );
}
