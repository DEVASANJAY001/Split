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
  X, XCircle, XSquare, Youtube, ZoomIn, ZoomOut
} from "lucide-react";

export const CATEGORY_LIBRARY = [
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
  { id: "Streaming", name: "Subscriptions", icon: Tv, color: "red" },
  
  // Work
  { id: "Office", name: "Office Supplies", icon: Briefcase, color: "slate" },
  { id: "Freelance", name: "Freelance Work", icon: Code, color: "emerald" },
  { id: "Insurance", name: "Insurance", icon: Shield, color: "blue" },
  
  // Home
  { id: "Groceries", name: "Groceries", icon: ShoppingCart, color: "green" },
  { id: "Furniture", name: "Furniture", icon: Box, color: "amber" },
  { id: "Pets", name: "Pets", icon: Heart, color: "rose" },
  
  // Others
  { id: "Investment", name: "Investment", icon: TrendingUp, color: "emerald" },
  { id: "Tax", name: "Taxes", icon: PieChart, color: "red" },
  { id: "Other", name: "Other", icon: HelpCircle, color: "gray" },
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

export function suggestCategory(description: string): string | null {
  const d = description.toLowerCase().trim();
  if (!d) return null;

  const mapping: Record<string, string[]> = {
    Food: ["food", "rest", "pizza", "burger", "eat", "lunch", "dinner", "meal", "breakfast", "swiggy", "zomato", "mcdonald", "kfc", "subway", "restaurant", "dining", "barbeque", "buffet"],
    Travel: ["travel", "flight", "hotel", "trip", "ticket", "stay", "airline", "indigo", "airasia", "vistara", "booking", "airbnb", "resort", "vacation", "tour", "visa", "passport"],
    Rent: ["rent", "home", "house", "mortgage", "flat", "apartment", "owner", "maintenance", "pg", "hostel", "deposit"],
    Utilities: ["electric", "water", "utility", "bill", "power", "gas", "recharge", "wifi", "internet", "broadband", "jio", "airtel", "vi", "sewage", "trash"],
    Shopping: ["shop", "amazon", "flipkart", "clothe", "buy", "myntra", "ajio", "mall", "store", "product", "item", "purchase", "gift", "shoe", "bag", "accessory"],
    Entertainment: ["movie", "film", "netflix", "game", "play", "show", "cinema", "theatre", "concert", "event", "club", "party", "pub", "ps5", "xbox", "gaming", "hotstar", "prime"],
    Fuel: ["fuel", "gas", "petrol", "diesel", "cng", "shell", "hp", "bpcl", "iocl", "filling"],
    Health: ["health", "med", "doctor", "gym", "fit", "hospital", "clinic", "pharmacy", "medicine", "yoga", "checkup", "dentist", "optical", "therapy"],
    Education: ["school", "edu", "course", "book", "learn", "college", "uni", "tuition", "fee", "exam", "training", "workshop", "stationery", "udemy", "coursera"],
    Taxi: ["taxi", "uber", "ola", "cab", "ride", "auto", "rapido", "rickshaw", "transport", "shuttle"],
    Coffee: ["coffee", "starbuck", "tea", "snack", "cafe", "baker", "cake", "cookie", "ccd", "chai", "blue tokai"],
    Groceries: ["grocery", "milk", "vege", "market", "mart", "blinkit", "zepto", "instamart", "bigbasket", "fruits", "vegetables", "kirana", "provisions"],
    Pets: ["pet", "dog", "cat", "vet", "food", "groom", "animal", "bird", "fish"],
    Software: ["software", "app", "subsc", "cloud", "it", "saas", "hosting", "domain", "adobe", "figma", "notion", "slack", "zoom", "google", "apple", "icloud"],
    Insurance: ["insurance", "premium", "policy", "lic", "medical", "term", "car insurance", "bike insurance"],
    Grooming: ["groom", "salon", "parlor", "hair", "cut", "spa", "massage", "facial", "makeup"],
    Gifts: ["gift", "present", "birthday", "anniversary", "wedding", "charity", "donation", "tip"],
    Furniture: ["furn", "table", "chair", "bed", "sofa", "desk", "decor", "curtain", "lamp", "ikea"],
    Investment: ["invest", "stock", "mutual", "sip", "fd", "gold", "crypto", "bitcoin", "share", "broker", "zerodha", "groww"],
  };

  // Direct match search
  for (const [cat, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => d.includes(k))) {
      return cat;
    }
  }

  return null;
}
