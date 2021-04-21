import { parseISO } from 'date-fns';

const baseFormatDateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function formatDate(
  date: Date | string | number,
  additionalFormatOptions: Intl.DateTimeFormatOptions = {}
) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...baseFormatDateOptions,
    ...additionalFormatOptions,
  });
  if (typeof date === 'string') {
    return formatter.format(parseISO(date));
  }
  return formatter.format(date);
}

export { formatDate, baseFormatDateOptions };
