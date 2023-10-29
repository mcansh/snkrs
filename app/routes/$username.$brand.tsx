import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export let loader = ({ params }: LoaderFunctionArgs) => {
  return redirect(`/${params.username}?brand=${params.brand}`);
};
