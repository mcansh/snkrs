import clsx from "clsx";
import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";

import { ClientHintCheck } from "~/lib/client-hints";

export function Document({
  children,
  bodyClassName,
  title,
}: {
  children: React.ReactNode;
  bodyClassName?: string;
  title?: string;
}) {
  let location = useLocation();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
        <meta
          property="og:url"
          content={`https://snkrs.mcan.sh${location.pathname}`}
        />
      </head>
      <body className={clsx("min-h-screen", bodyClassName)}>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <ClientHintCheck />
      </body>
    </html>
  );
}
