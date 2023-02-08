import { parseISO } from "date-fns";

let baseFormatDateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

function formatDate(
  date: Date | number | string,
  additionalFormatOptions: Intl.DateTimeFormatOptions = {}
) {
  let formatter = new Intl.DateTimeFormat("en-US", {
    ...baseFormatDateOptions,
    ...additionalFormatOptions,
  });
  if (typeof date === "string") {
    return formatter.format(parseISO(date));
  }
  return formatter.format(date);
}

export { formatDate, baseFormatDateOptions };
