const baseFormatDateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function formatDate(
  date: Date | string | number,
  additonalFormatOptions: Intl.DateTimeFormatOptions = {}
) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...baseFormatDateOptions,
    ...additonalFormatOptions,
  });
  if (typeof date === 'string') {
    return formatter.format(new Date(date));
  }
  return formatter.format(date);
}

export { formatDate, baseFormatDateOptions };
