import {
  Key,
  IdCard,
  CreditCard,
  FileText,
  Smartphone,
  Laptop,
  Wallet,
  Shirt,
  Glasses,
  BookOpen,
  Package,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Keys: Key,
  'ID Cards': IdCard,
  'ID Card': IdCard,
  'ATM Card': CreditCard,
  Documents: FileText,
  Electronics: Laptop,
  Phones: Smartphone,
  Phone: Smartphone,
  Wallet: Wallet,
  Purse: Wallet,
  Clothing: Shirt,
  Accessories: Glasses,
  Books: BookOpen,
  Stationery: BookOpen,
};

const fallbackIcon = Package;

const bgMap: Record<string, string> = {
  Keys: 'bg-amber-50',
  'ID Cards': 'bg-violet-50',
  'ID Card': 'bg-violet-50',
  'ATM Card': 'bg-indigo-50',
  Documents: 'bg-sky-50',
  Electronics: 'bg-blue-50',
  Phones: 'bg-blue-50',
  Phone: 'bg-blue-50',
  Wallet: 'bg-orange-50',
  Purse: 'bg-orange-50',
  Clothing: 'bg-pink-50',
  Accessories: 'bg-rose-50',
  Books: 'bg-teal-50',
  Stationery: 'bg-teal-50',
};

const colorMap: Record<string, string> = {
  Keys: 'text-amber-400',
  'ID Cards': 'text-violet-400',
  'ID Card': 'text-violet-400',
  'ATM Card': 'text-indigo-400',
  Documents: 'text-sky-400',
  Electronics: 'text-blue-400',
  Phones: 'text-blue-400',
  Phone: 'text-blue-400',
  Wallet: 'text-orange-400',
  Purse: 'text-orange-400',
  Clothing: 'text-pink-400',
  Accessories: 'text-rose-400',
  Books: 'text-teal-400',
  Stationery: 'text-teal-400',
};

export function getCategoryIcon(category: string | null | undefined) {
  const cat = category || 'Other';
  const Icon = iconMap[cat] || fallbackIcon;
  const bg = bgMap[cat] || 'bg-slate-100';
  const color = colorMap[cat] || 'text-slate-400';
  return { Icon, bg, color };
}
