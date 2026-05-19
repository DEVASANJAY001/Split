export const fmt = (n: number, currencyCode = "USD") => {
  const code = currencyCode.toUpperCase();
  
  // Natural locales matching currency codes for correct grouping (commas)
  let locale = "en-US";
  if (code === "INR") locale = "en-IN";
  else if (code === "EUR") locale = "en-IE"; // English representation for Euro to ensure clean layout
  else if (code === "GBP") locale = "en-GB";
  else if (code === "JPY") locale = "ja-JP";
  else if (code === "CAD") locale = "en-CA";
  else if (code === "AUD") locale = "en-AU";
  else if (code === "SGD") locale = "en-SG";
  else if (code === "NZD") locale = "en-NZ";
  else if (code === "AED") locale = "en-AE";
  else if (code === "SAR") locale = "en-SA";
  else if (code === "ZAR") locale = "en-ZA";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
      currencyDisplay: "symbol"
    }).format(n);
  } catch (e) {
    // Fallback if the currency code is invalid or not supported by the environment
    return `${code} ${n.toFixed(2)}`;
  }
};

export const getCurrencySymbol = (currencyCode = "USD") => {
  const code = currencyCode.toUpperCase();
  let locale = "en-US";
  if (code === "INR") locale = "en-IN";
  else if (code === "EUR") locale = "en-IE";
  else if (code === "GBP") locale = "en-GB";
  else if (code === "JPY") locale = "ja-JP";
  else if (code === "CAD") locale = "en-CA";
  else if (code === "AUD") locale = "en-AU";
  else if (code === "SGD") locale = "en-SG";
  else if (code === "NZD") locale = "en-NZ";
  else if (code === "AED") locale = "en-AE";
  else if (code === "SAR") locale = "en-SA";
  else if (code === "ZAR") locale = "en-ZA";

  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find(p => p.type === "currency")?.value || "$";
  } catch (e) {
    return "$";
  }
};
