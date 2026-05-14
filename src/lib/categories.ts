import { 
  ShoppingBag, Car, Home, Zap, Utensils, Film, Fuel, CreditCard, HelpCircle,
  Stethoscope, GraduationCap, Plane, Train, Bike, Coffee, Beer, Pizza, Cloud,
  Dumbbell, Music, Camera, Gift, Smartphone, Monitor, Book, Briefcase,
  Heart, Shield, Globe, ShoppingCart, Truck, MapPin, DollarSign, PieChart,
  Activity, Award, Bell, Box, Bus, Cake, Calculator, Calendar, CheckCircle, 
  ChevronRight, Clipboard, Clock, Code, Compass, Copy, Cpu, Database, Download, 
  Edit, ExternalLink, Eye, EyeOff, Facebook, FastForward, Feather, File, 
  FileText, Filter, Flag, Folder, GitBranch, Github, GitMerge, GitPullRequest, 
  Hash, Headset, Image, Inbox, Info, Instagram, Key, Layers, Layout, LifeBuoy, 
  Link, Linkedin, List, Loader, Lock, Mail, Map, Maximize, Menu, MessageCircle, 
  MessageSquare, Mic, Minimize, Minus, MoreHorizontal, MoreVertical, 
  MousePointer, Move, Navigation, Package, Paperclip, Pause, PenTool, Percent, 
  Phone, Play, Plus, Pocket, Power, Printer, Radio, RefreshCw, Repeat, Rewind, 
  Rss, Save, Scissors, Search, Send, Settings, Share2, Shuffle, Sidebar, 
  SkipBack, SkipForward, Slack, Slash, Sliders, Speaker, Square, Star, 
  StopCircle, Tablet, Tag, Target, Terminal, ThumbsDown, ThumbsUp, ToggleLeft, 
  ToggleRight, Trash2, Trello, TrendingDown, TrendingUp, Triangle, Tv, 
  Twitter, Type, Umbrella, Unlock, Upload, User, UserCheck, UserMinus, 
  UserPlus, Users, Video, VideoOff, Voicemail, Volume2, Watch, Wifi, Wind, 
  X, XCircle, XSquare, Youtube, ZoomIn, ZoomOut, Landmark
} from "lucide-react";

export const CATEGORY_LIBRARY = [
  // Others (Moved to 1st)
  { id: "Other", name: "Other", icon: HelpCircle, color: "gray" },

  // Core / Common
  { id: "Food", name: "Food & Dining", icon: Utensils, color: "orange" },
  { id: "Shopping", name: "Shopping", icon: ShoppingBag, color: "pink" },
  { id: "Travel", name: "Travel", icon: Plane, color: "blue" },
  { id: "Entertainment", name: "Entertainment", icon: Film, color: "purple" },
  { id: "Bills", name: "Bills & Fees", icon: CreditCard, color: "indigo" },
  { id: "Rent", name: "Rent & Mortgage", icon: Home, color: "amber" },
  { id: "Utilities", name: "Utilities", icon: Zap, color: "yellow" },
  { id: "Fuel", name: "Fuel & Gas", icon: Fuel, color: "slate" },
  { id: "Health", name: "Health & Medical", icon: Stethoscope, color: "red" },
  { id: "Education", name: "Education", icon: GraduationCap, color: "cyan" },
  
  // Transport
  { id: "Taxi", name: "Taxi & Ride", icon: Car, color: "yellow" },
  { id: "PublicTransport", name: "Public Transport", icon: Bus, color: "blue" },
  { id: "Parking", name: "Parking", icon: MapPin, color: "slate" },
  { id: "Maintenance", name: "Car Maintenance", icon: Settings, color: "gray" },
  
  // Personal Care
  { id: "Grooming", name: "Grooming & Salon", icon: Scissors, color: "pink" },
  { id: "Clothing", name: "Clothing", icon: ShoppingBag, color: "indigo" },
  { id: "Fitness", name: "Fitness & Gym", icon: Dumbbell, color: "emerald" },
  
  // Social
  { id: "Gifts", name: "Gifts & Charity", icon: Gift, color: "rose" },
  { id: "Party", name: "Party & Social", icon: Beer, color: "orange" },
  { id: "Coffee", name: "Coffee & Snacks", icon: Coffee, color: "brown" },
  
  // Tech
  { id: "Software", name: "Apps & Software", icon: Smartphone, color: "sky" },
  { id: "Electronics", name: "Electronics", icon: Monitor, color: "blue" },
  
  // Work
  { id: "Office", name: "Office Supplies", icon: Briefcase, color: "slate" },
  { id: "Freelance", name: "Freelance Work", icon: Code, color: "emerald" },
  { id: "Insurance", name: "Insurance", icon: Shield, color: "blue" },
  
  // Home
  { id: "Groceries", name: "Groceries", icon: ShoppingCart, color: "green" },
  { id: "Furniture", name: "Furniture", icon: Box, color: "amber" },
  { id: "Pets", name: "Pets", icon: Heart, color: "rose" },
  
  // Finance
  { id: "Investment", name: "Investment", icon: TrendingUp, color: "emerald" },
  { id: "Bank", name: "Banking & Transfer", icon: Landmark, color: "slate" },
  { id: "Tax", name: "Taxes", icon: PieChart, color: "red" },
  { id: "Streaming", name: "Subscriptions", icon: Repeat, color: "indigo" },
];

export const ALL_ICONS = [
  { name: "Activity", icon: Activity },
  { name: "Award", icon: Award },
  { name: "Bell", icon: Bell },
  { name: "Book", icon: Book },
  { name: "Briefcase", icon: Briefcase },
  { name: "Calendar", icon: Calendar },
  { name: "Camera", icon: Camera },
  { name: "Cloud", icon: Cloud },
  { name: "Compass", icon: Compass },
  { name: "CreditCard", icon: CreditCard },
  { name: "Database", icon: Database },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Edit", icon: Edit },
  { name: "Eye", icon: Eye },
  { name: "Feather", icon: Feather },
  { name: "File", icon: File },
  { name: "Filter", icon: Filter },
  { name: "Flag", icon: Flag },
  { name: "Gift", icon: Gift },
  { name: "Globe", icon: Globe },
  { name: "Heart", icon: Heart },
  { name: "Home", icon: Home },
  { name: "Image", icon: Image },
  { name: "Inbox", icon: Inbox },
  { name: "Info", icon: Info },
  { name: "Key", icon: Key },
  { name: "Layers", icon: Layers },
  { name: "Link", icon: Link },
  { name: "Lock", icon: Lock },
  { name: "Mail", icon: Mail },
  { name: "Map", icon: Map },
  { name: "Mic", icon: Mic },
  { name: "Music", icon: Music },
  { name: "Package", icon: Package },
  { name: "Phone", icon: Phone },
  { name: "Play", icon: Play },
  { name: "Plus", icon: Plus },
  { name: "Power", icon: Power },
  { name: "Radio", icon: Radio },
  { name: "Save", icon: Save },
  { name: "Search", icon: Search },
  { name: "Settings", icon: Settings },
  { name: "Share2", icon: Share2 },
  { name: "Shield", icon: Shield },
  { name: "Smartphone", icon: Smartphone },
  { name: "Star", icon: Star },
  { name: "Tag", icon: Tag },
  { name: "Target", icon: Target },
  { name: "Trash2", icon: Trash2 },
  { name: "Tv", icon: Tv },
  { name: "Umbrella", icon: Umbrella },
  { name: "User", icon: User },
  { name: "Video", icon: Video },
  { name: "Wifi", icon: Wifi },
  { name: "Zap", icon: Zap },
];

export function suggestCategory(description: string): string {
  const d = description.toLowerCase().trim();
  if (!d) return "Other";

  const mapping: Record<string, string[]> = {
    Food: ["food", "rest", "pizza", "burger", "eat", "lunch", "dinner", "meal", "breakfast", "swiggy", "zomato", "mcdonald", "kfc", "subway", "restaurant", "dining", "barbeque", "buffet", "starbuck", "ccd", "chai", "theobroma", "waffle", "momo", "haldiram", "saravana", "bikanervala", "behrouz", "faasos", "freshmenu", "eatsure", "eatfit", "box8", "truffles", "bakery", "cake"],
    Travel: ["travel", "flight", "hotel", "trip", "ticket", "stay", "airline", "indigo", "airasia", "vistara", "booking", "airbnb", "resort", "vacation", "tour", "visa", "passport", "makemytrip", "mmt", "goibibo", "cleartrip", "yatra", "agoda", "skyscanner", "oyo", "treebo", "fabhotel", "taj", "itc", "marriott", "hilton", "hyatt", "akasa", "emirates", "qatar", "singapore", "lufthansa", "british", "etihad", "turkish", "cathay", "vfs"],
    Rent: ["rent", "home", "house", "mortgage", "flat", "apartment", "owner", "maintenance", "pg", "hostel", "deposit", "nobroker", "magicbricks", "99acres", "housing", "housejoy", "rentomojo", "nestaway", "zolo", "colive"],
    Utilities: ["electric", "water", "utility", "bill", "power", "gas", "recharge", "wifi", "internet", "broadband", "jio", "airtel", "vi", "sewage", "trash", "bsnl", "act", "hathway", "adani", "bescom", "tangedco", "tataplay", "dishtv", "sun direct", "kent", "livpure", "forbes"],
    Shopping: ["shop", "amazon", "flipkart", "clothe", "buy", "myntra", "ajio", "mall", "store", "product", "item", "purchase", "gift", "shoe", "bag", "accessory", "meesho", "nykaa", "tatacliq", "reliance", "croma", "dmart", "big bazaar", "spencer", "ikea", "decathlon", "pepperfry", "firstcry", "snapdeal", "shopclues", "zara", "zudio", "westside", "nike", "adidas", "puma", "levi", "solly", "heusen", "market", "mart", "electronics"],
    Entertainment: ["movie", "film", "netflix", "game", "play", "show", "cinema", "theatre", "concert", "event", "club", "party", "pub", "ps5", "xbox", "gaming", "hotstar", "prime", "sony", "zee5", "gaana", "wynk", "mxplayer", "audible", "steam", "playstation", "epic", "garena", "dream11", "mpl", "winzo", "ludo", "bookmyshow", "twitch", "discord", "youtube", "yt", "vimeo"],
    Fuel: ["fuel", "gas", "petrol", "diesel", "cng", "shell", "hp", "bpcl", "iocl", "filling", "nayara", "bharat petroleum", "indian oil"],
    Health: ["health", "med", "doctor", "gym", "fit", "hospital", "clinic", "pharmacy", "medicine", "yoga", "checkup", "dentist", "optical", "therapy", "apollo", "practo", "1mg", "netmeds", "pharmeasy", "medplus", "fortis", "max", "thyrocare", "metropolis", "srl", "manipal", "columbia", "care hospitals", "wellness"],
    Education: ["school", "edu", "course", "book", "learn", "college", "uni", "tuition", "fee", "exam", "training", "workshop", "stationery", "udemy", "coursera", "byju", "unacademy", "vedantu", "toppr", "doubtnut", "skillshare", "edx", "simplilearn", "scaler", "upgrad", "internshala", "khan academy", "upsc", "ssc", "nta", "tcs ion", "duolingo", "udacity", "pluralsight", "whitehat"],
    Taxi: ["taxi", "uber", "ola", "cab", "ride", "auto", "rapido", "rickshaw", "transport", "shuttle", "namma metro", "delhi metro", "metro", "redbus", "abhibus", "confirmtkt", "railyatri", "blablacar"],
    Coffee: ["coffee", "starbuck", "tea", "snack", "cafe", "baker", "cake", "cookie", "ccd", "chai", "blue tokai", "third wave", "chaipoint", "chaayos", "theobroma", "barista"],
    Groceries: ["grocery", "milk", "vege", "market", "mart", "blinkit", "zepto", "instamart", "bigbasket", "fruits", "vegetables", "kirana", "provisions", "jiomart", "dunzo", "reliance smart", "dmart"],
    Pets: ["pet", "dog", "cat", "vet", "food", "groom", "animal", "bird", "fish"],
    Software: ["software", "app", "cloud", "it", "saas", "hosting", "domain", "adobe", "figma", "notion", "slack", "zoom", "google", "apple", "icloud", "aws", "azure", "salesforce", "hubspot", "zoho", "freshworks", "github", "gitlab", "digitalocean", "vercel", "netlify"],
    Streaming: ["subsc", "netflix", "spotify", "youtube", "premium", "disney", "hulu", "hbo", "hotstar", "prime", "membership", "plan", "monthly", "yearly", "apple music", "jio saavn", "gaana", "wynk"],
    Insurance: ["insurance", "premium", "policy", "lic", "medical", "term", "car insurance", "bike insurance", "hdfc life", "icici prudential", "star health", "niva bupa", "religare"],
    Grooming: ["groom", "salon", "parlor", "hair", "cut", "spa", "massage", "facial", "makeup", "sephora", "purplle", "mamaearth", "lakme", "beardo", "shaving", "ustraa"],
    Gifts: ["gift", "present", "birthday", "anniversary", "wedding", "charity", "donation", "tip"],
    Furniture: ["furn", "table", "chair", "bed", "sofa", "desk", "decor", "curtain", "lamp", "ikea", "pepperfry", "urban ladder", "godrej"],
    Investment: ["invest", "stock", "mutual", "sip", "fd", "gold", "crypto", "bitcoin", "share", "broker", "zerodha", "groww", "upstox", "angel one", "kite", "et money", "kuvera", "indmoney", "coinswitch", "wazirx", "binance", "coinbase", "fidelity", "vanguard", "robinhood", "etoro", "schwab", "wealthy", "tanishq"],
    Bank: ["bank", "transfer", "hdfc", "icici", "sbi", "axis", "kotak", "atm", "cash", "neft", "rtgs", "imps", "wire", "hsbc", "standard chartered", "citi", "amex", "rupay", "slice", "onecard", "lazypay", "simpl", "phonepe", "paytm", "gpay", "bharatpe"],
  };

  // Direct match search
  for (const [cat, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => d.includes(k))) {
      return cat;
    }
  }

  return "Other";
}
