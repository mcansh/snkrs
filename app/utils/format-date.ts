import { parseISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

let baseFormatDateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

function formatDate(
  date: Date | number | string,
  timezone?: string,
  additionalFormatOptions: Intl.DateTimeFormatOptions = {}
) {
  let formatter = new Intl.DateTimeFormat("en-US", {
    ...baseFormatDateOptions,
    ...additionalFormatOptions,
  });

  if (typeof date === "string") {
    date = parseISO(date);
  }

  if (!timezone) return formatter.format(date);
  return formatter.format(utcToZonedTime(date, timezone));
}

export { formatDate, baseFormatDateOptions };
