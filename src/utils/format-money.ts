const baseFormatMoneyOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
};

function formatMoney(amount: number) {
  const options = baseFormatMoneyOptions;
  // if its a whole, dollar amount, leave off the .00
  if (amount % 100 === 0) options.minimumFractionDigits = 0;
  const formatter = new Intl.NumberFormat('en-US', options);
  return formatter.format(amount / 100);
}

export { formatMoney, baseFormatMoneyOptions };
