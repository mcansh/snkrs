import { parseISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export let baseFormatDateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export function formatDate(
  date: Date | number | string,
  timeZone: string,
  additionalFormatOptions: Intl.DateTimeFormatOptions = {}
) {
  let formatter = new Intl.DateTimeFormat("en-US", {
    ...baseFormatDateOptions,
    ...additionalFormatOptions,
  });
  if (typeof date === "string") {
    date = parseISO(date);
  }

  return formatter.format(utcToZonedTime(date, timeZone));
}
