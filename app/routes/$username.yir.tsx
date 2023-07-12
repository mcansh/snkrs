import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { $path } from "remix-routes";

export let loader = ({ params }: LoaderArgs) => {
  if (!params.username) {
    throw new Response("Not Found", {status: 404,statusText: "Not Found",
    });
  }
  return redirect(
    $path("/:username/yir/:year", {
      username: params.username,
      year: new Date().getFullYear().toString(),
    }),
  );
};
