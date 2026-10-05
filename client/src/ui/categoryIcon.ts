import {
  AirVent,
  CookingPot,
  Droplets,
  Laptop,
  Microwave,
  Monitor,
  Package,
  Refrigerator,
  ShowerHead,
  Tv,
  Utensils,
  WashingMachine,
  Wind,
  type LucideIcon,
} from 'lucide-react';

// Keyed by the built-in category names (server/src/db/seed-data.ts).
const ICONS: Record<string, LucideIcon> = {
  'Air Conditioner': AirVent,
  Refrigerator: Refrigerator,
  'Washing Machine': WashingMachine,
  Television: Tv,
  'Water Purifier': Droplets,
  'Geyser / Water Heater': ShowerHead,
  Laptop: Laptop,
  'Microwave Oven': Microwave,
  Dishwasher: Utensils,
  'Kitchen Chimney': CookingPot,
  'Air Purifier': Wind,
  'Desktop Computer': Monitor,
};

export function categoryIcon(category: string): LucideIcon {
  return ICONS[category] ?? Package;
}
