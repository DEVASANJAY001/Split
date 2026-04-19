export const fmt = (n: number, currencyCode = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
      currencyDisplay: "symbol"
    }).format(n);
  } catch (e) {
    // Fallback if the currency code is invalid or not supported by the environment
    return `${currencyCode} ${n.toFixed(2)}`;
  }
};
