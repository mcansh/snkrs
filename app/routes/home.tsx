import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { route } from "routes-gen";

import screenshotUrl from "~/assets/screenshot.jpg";
import { getSeoMeta } from "~/seo";

export let loader = async (_args: LoaderArgs) => {
  return json({
    demo: process.env.DEFAULT_USER,
  });
};

export let meta: MetaFunction = () => {
  return getSeoMeta({
    title: "Home",
  });
};

export default function IndexPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <main>
      <div className="pt-8 overflow-hidden sm:pt-12 lg:relative lg:py-48">
        <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl lg:grid lg:grid-cols-2 lg:gap-24">
          <div>
            <div>
              <svg className="h-11 w-12 text-indigo-500">
                <use href="/workflow-mark.svg#workflow" />
              </svg>
            </div>
            <div className="mt-20">
              <div className="sm:max-w-xl">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                  SNKRS
                </h1>
                <p className="mt-6 text-xl text-gray-500">
                  Showcase your collection
                </p>
                <div className="mt-12 sm:max-w-lg sm:w-full flex sm:flex-row sm:space-x-4 sm:space-y-0 space-y-4 flex-col">
                  <Link
                    to={route("/join")}
                    className="rounded-md border border-transparent px-5 py-3 bg-indigo-500 text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10 text-center"
                  >
                    Get started
                  </Link>
                  <Link
                    to={route("/:username", { username: data.demo })}
                    className="rounded-md border border-transparent px-5 py-3 bg-rose-500 text-base font-medium text-white shadow hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:px-10 text-center"
                  >
                    View live demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
          <div className="py-12 sm:relative sm:mt-12 sm:py-16 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="hidden sm:block">
              <div className="absolute inset-y-0 left-1/2 w-screen bg-gray-50 rounded-l-3xl lg:left-80 lg:right-0 lg:w-full" />
              <svg
                className="absolute top-8 right-1/2 -mr-3 lg:m-0 lg:left-0"
                width={404}
                height={392}
                fill="none"
                viewBox="0 0 404 392"
              >
                <defs>
                  <pattern
                    id="837c3e70-6c3a-44e6-8854-cc48c737b659"
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={4}
                      className="text-gray-200"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect
                  width={404}
                  height={392}
                  fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)"
                />
              </svg>
            </div>
            <div className="relative pl-4 -mr-40 sm:mx-auto sm:max-w-3xl sm:px-0 lg:max-w-none lg:h-full lg:pl-12">
              <img
                className="w-full rounded-md shadow-xl ring-1 ring-black ring-opacity-5 lg:h-full lg:w-auto lg:max-w-none"
                src={screenshotUrl}
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
