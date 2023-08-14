import * as React from "react";
import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import type { V2_MetaFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { cssBundleHref } from "@remix-run/css-bundle";
import * as Fathom from "fathom-client";
import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";

import appStylesHref from "~/styles/global.css";
import screenshotUrl from "~/assets/screenshot.jpg";

import { useMatches } from "./lib/use-matches";
import { getSession, getUser } from "./session.server";
import interStylesHref from "./styles/inter.css";
import { Svg } from "./components/heroicons";
import { Document } from "./components/document";
import { env } from "./env.server";
import { Button } from "./components/ui/button";

export async function loader({ request }: LoaderArgs) {
  let user = await getUser(request);
  let session = await getSession(request);
  return json({
    user,
    timeZone: session.get("timeZone"),
    ENV: {
      FATHOM_SITE_ID: env.FATHOM_SITE_ID,
      FATHOM_SCRIPT_URL: env.FATHOM_SCRIPT_URL,
    },
    origin: new URL(request.url).origin,
  });
}

export let meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  return [
    { title: "Snkrs" },
    { name: "description", content: "show off your sneaker collection" },
    { property: "og:title", content: "Snkrs" },
    { property: "og:description", content: "show off your sneaker collection" },
    { property: "og:image", content: data.origin + screenshotUrl },
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

export default function App() {
  let data = useLoaderData<typeof loader>();
  let navigation = useNavigation();
  let location = useLocation();
  let fetcher = useFetcher();
  let [showPendingSpinner, setShowPendingSpinner] = React.useState(false);
  let [showMenu, setShowMenu] = React.useState(false);
  let [showTimeZonePrompt, setShowTimeZonePrompt] = React.useState(false);

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
          location.pathname !== "/profile",
      );
    }, 500);

    setShowMenu(false);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, navigation.formMethod, navigation.state]);

  let updateTimeZone = React.useCallback(
    (timeZone: string) => {
      let formData = new FormData();
      formData.append("timeZone", timeZone);
      fetcher.submit(formData, {
        action: "/api/timezone",
        method: "post",
      });
    },
    [fetcher],
  );

  React.useEffect(() => {
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!data.timeZone) {
      updateTimeZone(timeZone);
    } else if (data.timeZone !== timeZone) {
      setShowTimeZonePrompt(true);
    }
  }, [data.timeZone, fetcher.submit, updateTimeZone]);

  return (
    <Document
      bodyClassName={clsx(
        showPendingSpinner ? "opacity-60 cursor-not-allowed" : "",
        handleBodyClassName,
      )}
    >
      {showPendingSpinner && (
        <div className="fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform-gpu">
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
              <div className="relative ml-auto flex h-full w-full max-w-xs flex-col space-y-4 overflow-y-auto bg-white px-4 pb-6 pt-4 shadow-xl">
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
                <Button asChild variant="secondary">
                  <Link to="/">Home</Link>
                </Button>
                {data.user ? (
                  <>
                    <Button asChild>
                      <Link to="sneakers/add" prefetch="intent">
                        Add Sneaker
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="profile" prefetch="intent">
                        Edit Account
                      </Link>
                    </Button>
                    <Form reloadDocument method="post" action="logout">
                      <Button type="submit" variant="destructive">
                        Logout
                      </Button>
                    </Form>
                  </>
                ) : (
                  <>
                    <Button asChild variant="default">
                      <Link to="login" prefetch="intent">
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="indigo">
                      <Link to="join" prefetch="intent">
                        Join
                      </Link>
                    </Button>
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

      {showTimeZonePrompt ? (
        <div
          className="fixed bottom-2 left-2 right-2 sm:left-auto"
          role="alert"
          aria-live="polite"
        >
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Svg
                  className="h-6 w-6 fill-none stroke-gray-400"
                  name="24:outline:clock"
                />
              </div>
              <div className="flex-grow">
                <p className="text-xs font-medium text-gray-900 sm:text-sm">
                  Your timeZone has changed.
                </p>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Would you like to update?
                </p>
              </div>
              <div className="flex-shrink-0 space-x-2">
                <Button
                  variant="indigo"
                  type="button"
                  onClick={() => {
                    let { timeZone } = Intl.DateTimeFormat().resolvedOptions();
                    updateTimeZone(timeZone);
                    setShowTimeZonePrompt(false);
                  }}
                >
                  Yes
                </Button>
                <button
                  type="button"
                  className="inline-flex items-center rounded border border-transparent bg-rose-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  onClick={() => setShowTimeZonePrompt(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Document>
  );
}

export function ErrorBoundary() {
  let error = useRouteError();
  console.error("Check your server terminal output");

  if (isRouteErrorResponse(error)) {
    if (error.error) {
      return (
        <Document
          title="Shoot..."
          bodyClassName="min-h-screen w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod"
        >
          <h1 className="text-blue-bsod inline-block bg-white text-3xl font-bold">
            Uncaught Exception!
          </h1>
          <p>
            If you are not the developer, please click back in your browser and
            try again.
          </p>
          <pre className="overflow-auto border-4 border-white px-4 py-2">
            {error.error?.message}
          </pre>
          <p>
            There was an uncaught exception in your application. Check the
            browser console and/or the server console to inspect the error.
          </p>
        </Document>
      );
    }

    return (
      <Document
        title={`${error.status} ${error.statusText}`}
        bodyClassName="w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod"
      >
        <h1 className="text-blue-bsod inline-block bg-white text-3xl font-bold">
          {error.status} {error.statusText}
        </h1>
      </Document>
    );
  }

  return (
    <Document
      title="Oops!"
      bodyClassName="w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod"
    >
      <h1 className="text-blue-bsod inline-block bg-white text-3xl font-bold">
        Oops!
      </h1>
      <p>Something went wrong</p>
    </Document>
  );
}
