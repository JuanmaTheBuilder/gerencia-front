export const currencyFormatter = (value: unknown) => {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return [`$${isNaN(num) ? '0.00' : num.toFixed(2)}`, ''];
};

export const currencyFormatterWithLabel = (label: string) => (value: unknown) => {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return [`$${isNaN(num) ? '0.00' : num.toFixed(2)}`, label];
};
