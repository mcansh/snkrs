import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { $path } from "remix-routes";

import { invariantResponse } from "~/lib/http.server";

export let loader = ({ params }: LoaderFunctionArgs) => {
  invariantResponse(params.username, 404);
  return redirect(
    $path("/:username/yir/:year", {
      username: params.username,
      year: new Date().getFullYear().toString(),
    }),
  );
};
