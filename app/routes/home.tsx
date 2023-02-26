import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { route } from "routes-gen";

import screenshotUrl from "~/assets/screenshot.jpg";
import { env } from "~/env";
import { getPageTitle, mergeMeta } from "~/meta";

export let loader = async (_args: LoaderArgs) => {
  return json({
    demo: env.DEFAULT_USER,
  });
};

export let meta: V2_MetaFunction = mergeMeta(() => {
  return [{ title: getPageTitle("Home") }];
});

export default function IndexPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <main>
      <div className="overflow-hidden pt-8 sm:pt-12 lg:relative lg:py-48">
        <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-24 lg:px-8">
          <div>
            <div>
              <svg className="h-11 w-12 text-indigo-500">
                <use href="/workflow-mark.svg#workflow" />
              </svg>
            </div>
            <div className="mt-20">
              <div className="sm:max-w-xl">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                  SNKRS
                </h1>
                <p className="mt-6 text-xl text-gray-500">
                  Showcase your collection
                </p>
                <div className="mt-12 flex flex-col space-y-4 sm:w-full sm:max-w-lg sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    to={route("/join")}
                    className="rounded-md border border-transparent bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10"
                  >
                    Get started
                  </Link>
                  <Link
                    to={route("/:username", { username: data.demo })}
                    className="rounded-md border border-transparent bg-rose-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:px-10"
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
              <div className="absolute inset-y-0 left-1/2 w-screen rounded-l-3xl bg-gray-50 lg:left-80 lg:right-0 lg:w-full" />
              <svg
                className="absolute top-8 right-1/2 -mr-3 lg:left-0 lg:m-0"
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
            <div className="relative -mr-40 pl-4 sm:mx-auto sm:max-w-3xl sm:px-0 lg:h-full lg:max-w-none lg:pl-12">
              <img
                className="w-full rounded-md shadow-xl ring-1 ring-black ring-opacity-5 lg:h-full lg:w-auto lg:max-w-none"
                src={screenshotUrl}
                alt=""
                width={2648}
                height={1788}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
