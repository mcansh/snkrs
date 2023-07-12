import { STATUS_CODES } from "node:http";

export function invariantResponse(
  condition: any,
  status: number,
  message = STATUS_CODES[status],
): asserts condition {
  if (condition) return;

  let statusText = STATUS_CODES[status];
  let init: ResponseInit = { status };
  if (statusText) init.statusText = statusText;

  throw new Response(message || null, init);
}
