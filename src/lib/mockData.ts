import a1 from "@/assets/avatar-1.jpg";
import a3 from "@/assets/avatar-3.jpg";
import a4 from "@/assets/avatar-4.jpg";
import a5 from "@/assets/avatar-5.jpg";

export type Person = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
};

export const me: Person = {
  id: "u_me",
  name: "You",
  email: "eli@split.app",
  avatar: a1,
  initials: "EM",
};

export const people: Person[] = [
  me,
  { id: "u_2", name: "Jake Cooper", email: "jake.cooper@example.com", avatar: a5, initials: "JC" },
  { id: "u_3", name: "Sofia Cruz", email: "sofi.cruz@yahoo.com", avatar: a3, initials: "SC" },
  { id: "u_4", name: "Angel Howard", email: "angel.lawson@gmail.com", avatar: a4, initials: "AH" },
  { id: "u_5", name: "Jay Park", email: "jay.park@studio.io", avatar: a5, initials: "JP" },
];

export type Category = "Food" | "Travel" | "Bills" | "Shopping" | "Income" | "Rent" | "Entertainment";

export type Transaction = {
  id: string;
  title: string;
  category: Category;
  amount: number;
  date: string;
  merchant?: string;
};

export const transactions: Transaction[] = [
  { id: "t1", title: "Salary — Northwind Co.", category: "Income", amount: 8240, date: "2025-04-01" },
  { id: "t2", title: "Urban Provisioning", category: "Food", amount: -142.5, date: "2025-04-14", merchant: "Grocer" },
  { id: "t3", title: "Aura Workspace", category: "Bills", amount: -450, date: "2025-04-12" },
  { id: "t4", title: "Bistro Lumen", category: "Food", amount: -68.2, date: "2025-04-11" },
  { id: "t5", title: "Coastal Rail", category: "Travel", amount: -89, date: "2025-04-10" },
  { id: "t6", title: "Stream+ subscription", category: "Entertainment", amount: -14.99, date: "2025-04-09" },
  { id: "t7", title: "Linen & Co.", category: "Shopping", amount: -212.4, date: "2025-04-07" },
  { id: "t8", title: "Apartment Rent", category: "Rent", amount: -1750, date: "2025-04-03" },
  { id: "t9", title: "Freelance — Atelier", category: "Income", amount: 1240, date: "2025-04-15" },
];

export const monthlyTrend = [
  { m: "Nov", income: 7800, expense: 3100 },
  { m: "Dec", income: 8120, expense: 3650 },
  { m: "Jan", income: 8240, expense: 3320 },
  { m: "Feb", income: 8240, expense: 2980 },
  { m: "Mar", income: 8540, expense: 3540 },
  { m: "Apr", income: 9480, expense: 3413 },
];

export type Group = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  expenses: GroupExpense[];
};

export type GroupExpense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  shares: Record<string, number>;
  date: string;
};

export const groups: Group[] = [
  {
    id: "g1",
    name: "Lisbon Trip",
    description: "April getaway",
    memberIds: ["u_me", "u_2", "u_3", "u_4"],
    expenses: [
      { id: "e1", title: "Airbnb", amount: 880, paidBy: "u_me", date: "2025-04-02", shares: { u_me: 220, u_2: 220, u_3: 220, u_4: 220 } },
      { id: "e2", title: "Tasca dinner", amount: 156, paidBy: "u_2", date: "2025-04-04", shares: { u_me: 39, u_2: 39, u_3: 39, u_4: 39 } },
      { id: "e3", title: "Tram passes", amount: 48, paidBy: "u_3", date: "2025-04-05", shares: { u_me: 12, u_2: 12, u_3: 12, u_4: 12 } },
    ],
  },
  {
    id: "g2",
    name: "Roommates",
    description: "Apartment shared bills",
    memberIds: ["u_me", "u_5"],
    expenses: [
      { id: "e4", title: "Utilities", amount: 180, paidBy: "u_me", date: "2025-04-08", shares: { u_me: 90, u_5: 90 } },
      { id: "e5", title: "Internet", amount: 60, paidBy: "u_5", date: "2025-04-10", shares: { u_me: 30, u_5: 30 } },
    ],
  },
  {
    id: "g3",
    name: "Studio Night",
    description: "One-off party",
    memberIds: ["u_me", "u_2", "u_4"],
    expenses: [
      { id: "e6", title: "Catering", amount: 240, paidBy: "u_4", date: "2025-04-13", shares: { u_me: 80, u_2: 80, u_4: 80 } },
    ],
  },
];

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  dailyTarget: number;
  streakDays: number;
  emoji: string;
};

export const goals: Goal[] = [
  { id: "go1", name: "Emergency Fund", target: 12000, saved: 7820, dailyTarget: 25, streakDays: 42, emoji: "◐" },
  { id: "go2", name: "Kyoto in Autumn", target: 4500, saved: 1380, dailyTarget: 15, streakDays: 18, emoji: "◇" },
  { id: "go3", name: "New Lens", target: 1800, saved: 1620, dailyTarget: 10, streakDays: 73, emoji: "◯" },
];

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  cycle: "monthly" | "yearly";
  nextDate: string;
  category: string;
  tone: "neutral" | "soft" | "brand";
};

export const subscriptions: Subscription[] = [
  { id: "s1", name: "Adobe", amount: 32.99, cycle: "monthly", nextDate: "2025-04-22", category: "Monthly Bill", tone: "neutral" },
  { id: "s2", name: "Spotify", amount: 9.99, cycle: "monthly", nextDate: "2025-04-25", category: "Subscription", tone: "soft" },
  { id: "s3", name: "Netflix", amount: 14.95, cycle: "monthly", nextDate: "2025-04-28", category: "Monthly Plan", tone: "brand" },
  { id: "s4", name: "Atlas News", amount: 60, cycle: "yearly", nextDate: "2025-09-01", category: "Reading", tone: "neutral" },
];

export type Card = { id: string; name: string; last4: string; balance: number; tone: "brand" | "neutral" };
export const cards: Card[] = [
  { id: "c1", name: "Marble Debit", last4: "4821", balance: 4280.55, tone: "brand" },
  { id: "c2", name: "Aurora Credit", last4: "1192", balance: -312.4, tone: "neutral" },
];
