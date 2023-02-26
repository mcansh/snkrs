import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { timeZones } from "~/lib/timezones";
import { commitSession, getSession } from "~/session.server";

export async function action({ request }: DataFunctionArgs) {
  let session = await getSession(request);
  let formData = await request.formData();
  let timeZone = formData.get("timeZone");
  if (
    timeZone &&
    typeof timeZone === "string" &&
    timeZones.includes(timeZone)
  ) {
    session.set("timeZone", timeZone);
    return json(true, {
      headers: {
        "content-type": "application/json",
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return false;
}
