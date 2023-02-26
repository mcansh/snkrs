import * as React from "react";
import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { cssBundleHref } from "@remix-run/css-bundle";
import * as Fathom from "fathom-client";
import clsx from "clsx";
import appStylesHref from "tailwindcss/tailwind.css";
import { Dialog, Transition } from "@headlessui/react";

import screenshotUrl from "~/assets/screenshot.jpg";

import { useMatches } from "./lib/use-matches";
import { getUser } from "./session.server";
import interStylesHref from "./styles/inter.css";
import { Svg } from "./components/heroicons";
import { Document } from "./components/document";
import { env } from "./env";

export { CatchBoundary } from "./components/root-catch-boundary";
export { ErrorBoundary } from "./components/root-error-boundary";

export let meta: V2_MetaFunction = () => {
  return [
    { title: "Snkrs" },
    { name: "description", content: "show off your sneaker collection" },
    { property: "og:title", content: "Snkrs" },
    { property: "og:description", content: "show off your sneaker collection" },
    { property: "og:image", content: screenshotUrl },
    { property: "og:image:alt", content: "screenshot of the Snkrs app" },
    { property: "og:image:width", content: "2648" },
    { property: "og:image:height", content: "1788" },
    { name: "apple-mobile-web-app-title", content: "Sneakers" },
    { name: "application-name", content: "Sneakers" },
    { name: "msapplication-TileColor", content: "#000000" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black-translucent",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  ];
};

export let links: LinksFunction = () => {
  let result = [
    { rel: "preload", href: appStylesHref, as: "style" },
    { rel: "preload", href: interStylesHref, as: "style" },
    { rel: "stylesheet", href: appStylesHref },
    { rel: "stylesheet", href: interStylesHref },
    {
      rel: "icon",
      href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext x='0' y='14'%3E👟%3C/text%3E%3C/svg%3E",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "alternate icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "alternate icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    { rel: "manifest", href: "/manifest.webmanifest" },
    { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#000000" },
  ];

  if (cssBundleHref) {
    result.push({ rel: "preload", href: cssBundleHref, as: "style" });
    result.push({ rel: "stylesheet", href: cssBundleHref });
  }

  return result;
};

export async function loader({ request }: LoaderArgs) {
  let user = await getUser(request);
  return json({
    user,
    ENV: {
      FATHOM_SITE_ID: env.FATHOM_SITE_ID,
      FATHOM_SCRIPT_URL: env.FATHOM_SCRIPT_URL,
    },
  });
}

export default function App() {
  let data = useLoaderData<typeof loader>();
  let navigation = useNavigation();
  let location = useLocation();
  let fetcher = useFetcher();
  let [showPendingSpinner, setShowPendingSpinner] = React.useState(false);
  let [showMenu, setShowMenu] = React.useState(false);

  let fathomInitialized = React.useRef(false);

  let matches = useMatches();
  let handleBodyClassName = matches.map((match) => match.handle?.bodyClassName);

  React.useEffect(() => {
    if (fathomInitialized.current) return;
    Fathom.load(data.ENV.FATHOM_SITE_ID, {
      excludedDomains: ["localhost"],
      url: data.ENV.FATHOM_SCRIPT_URL,
    });
    fathomInitialized.current = true;
  }, [data.ENV.FATHOM_SCRIPT_URL, data.ENV.FATHOM_SITE_ID]);

  React.useEffect(() => {
    Fathom.trackPageview({
      url: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    let timer = setTimeout(() => {
      setShowPendingSpinner(
        navigation.state !== "idle" &&
          navigation.formMethod !== "post" &&
          location.pathname !== "/profile"
      );
    }, 500);

    setShowMenu(false);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, navigation.formMethod, navigation.state]);

  React.useEffect(() => {
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let formData = new FormData();
    formData.append("timeZone", timeZone);
    fetcher.submit(formData, {
      action: "/api/timezone",
      method: "post",
    });
  }, []);

  return (
    <Document
      bodyClassName={clsx(
        showPendingSpinner ? "opacity-60 cursor-not-allowed" : "",
        handleBodyClassName
      )}
    >
      {showPendingSpinner && (
        <div className="fixed top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform-gpu">
          <Svg
            className="z-10 h-10 w-10 animate-spin fill-none stroke-blue-600 stroke-2"
            name="24:outline:arrow-path"
          />
        </div>
      )}

      <nav className="flex items-center justify-end px-4 py-2 sm:px-6 lg:px-8">
        <Transition.Root show={showMenu} as={React.Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-40 flex"
            onClose={setShowMenu}
          >
            <Transition.Child
              as={React.Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="relative ml-auto flex h-full w-full max-w-xs flex-col space-y-4 overflow-y-auto bg-white px-4 pt-4 pb-6 shadow-xl">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center fill-gray-400 p-2 hover:fill-gray-500"
                    onClick={() => setShowMenu(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <Svg className="h-6 w-6" name="24:solid:x-mark" />
                  </button>
                </div>
                <Link
                  to="/"
                  className="w-full rounded-md border border-transparent bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10"
                >
                  Home
                </Link>
                {data.user ? (
                  <>
                    <Link
                      to="sneakers/add"
                      className="w-full rounded-md border border-transparent bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10"
                    >
                      Add Sneaker
                    </Link>
                    <Link
                      to="profile"
                      className="w-full rounded-md border border-transparent bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10"
                    >
                      Edit Account
                    </Link>
                    <Form reloadDocument method="post" action="logout">
                      <button
                        type="submit"
                        className="w-full rounded-md border border-transparent bg-rose-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:px-10"
                      >
                        Logout
                      </button>
                    </Form>
                  </>
                ) : (
                  <>
                    <Link
                      to="login"
                      className="rounded-md border border-transparent bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-10"
                    >
                      Login
                    </Link>
                    <Link
                      to="join"
                      className="w-full rounded-md border border-transparent bg-rose-500 px-5 py-3 text-center text-base font-medium text-white shadow hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:px-10"
                    >
                      Join
                    </Link>
                  </>
                )}
              </div>
            </Transition.Child>
          </Dialog>
        </Transition.Root>

        <button type="button" onClick={() => setShowMenu(true)}>
          <span className="sr-only">Open menu</span>
          <Svg
            className="h-10 w-10 fill-gray-400 hover:fill-gray-500"
            name="24:solid:bars-3"
          />
        </button>
      </nav>

      <Outlet />
    </Document>
  );
}
