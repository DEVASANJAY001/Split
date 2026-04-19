import { Plane, Home, Heart, PartyPopper, Briefcase, Package, Utensils, Car, Lightbulb, ShoppingBag, Film, Fuel, Receipt, Wallet, type LucideIcon } from "lucide-react";
import type { GroupType, Category } from "./store";

export const groupIcons: Record<GroupType, LucideIcon> = {
  Trip: Plane,
  Roommates: Home,
  Couple: Heart,
  Friends: PartyPopper,
  Office: Briefcase,
  Other: Package,
};

export const categoryIcons: Record<Category, LucideIcon> = {
  Food: Utensils,
  Travel: Plane,
  Rent: Home,
  Utilities: Lightbulb,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Fuel: Fuel,
  Bills: Receipt,
  Other: Package,
};

export const personalIcon: LucideIcon = Wallet;
