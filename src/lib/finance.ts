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

export const getCurrencySymbol = (currencyCode = "USD") => {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).formatToParts(0);
    return parts.find(p => p.type === "currency")?.value || "$";
  } catch (e) {
    return "$";
  }
};
