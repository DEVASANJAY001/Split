export const BRAND_DOMAINS: Record<string, string> = {
  // OTT / Entertainment
  netflix: "netflix.com",
  spotify: "spotify.com",
  youtube: "youtube.com",
  disney: "disneyplus.com",
  hulu: "hulu.com",
  prime: "amazon.com",
  hbo: "hbo.com",
  hotstar: "hotstar.com",
  altbalaji: "altbalaji.com",
  jiocinema: "jiocinema.com",
  sony: "sonyliv.com",
  crunchyroll: "crunchyroll.com",

  // Shopping
  amazon: "amazon.com",
  flipkart: "flipkart.com",
  walmart: "walmart.com",
  ebay: "ebay.com",
  apple: "apple.com",
  google: "google.com",
  myntra: "myntra.com",
  ajio: "ajio.com",
  meesho: "meesho.com",
  nykaa: "nykaa.com",
  zara: "zara.com",
  zudio: "tata.com", // More stable domain for Zudio (Tata Group)
  westside: "tata.com",
  pantaloon: "pantaloons.com",
  max: "maxfashion.in",
  "h&m": "hm.com",
  adidas: "adidas.com",
  nike: "nike.com",
  puma: "puma.com",
  reebok: "reebok.com",

  // Food / Dining / Delivery
  uber: "uber.com",
  mcdonald: "mcdonalds.com",
  starbuck: "starbucks.com",
  domino: "dominos.com",
  zomato: "zomato.com",
  swiggy: "swiggy.com",
  pizza: "pizzahut.com",
  kfc: "kfc.com",
  burgerking: "burgerking.com",
  subway: "subway.com",
  blinkit: "blinkit.com",
  zepto: "zepto.com",
  instamart: "swiggy.com",
  bigbasket: "bigbasket.com",

  // Transport / Travel
  lyft: "lyft.com",
  ola: "olacabs.com",
  rapido: "rapido.com",
  irctc: "irctc.co.in",
  indigo: "goindigo.in",
  airindia: "airindia.com",
  makemytrip: "makemytrip.com",
  goibibo: "goibibo.com",
  cleartrip: "cleartrip.com",
  expedia: "expedia.com",
  booking: "booking.com",
  airbnb: "airbnb.com",
  uberauto: "uber.com",

  // Payments / Finance
  paytm: "paytm.com",
  phonepe: "phonepe.com",
  gpay: "google.com",
  cred: "cred.club",
  zerodha: "zerodha.com",
  groww: "groww.in",
  lic: "licindia.in",
  hdfc: "hdfcbank.com",
  icici: "icicibank.com",
  sbi: "sbi.co.in",

  // Services / Utility
  airtel: "airtel.in",
  jio: "jio.com",
  vi: "myvi.in",
  urbanclap: "urbancompany.com",
  urbancompany: "urbancompany.com",
};

export function getBrandIcon(description: string): string | null {
  if (!description) return null;
  const desc = description.toLowerCase().trim();
  
  for (const [key, domain] of Object.entries(BRAND_DOMAINS)) {
    if (desc.includes(key)) {
      return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    }
  }
  return null;
}
