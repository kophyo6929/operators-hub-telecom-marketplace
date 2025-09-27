export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  operator: "MPT" | "OOREDOO" | "ATOM" | "MYTEL";
  category: "Data" | "Minutes" | "Points" | "Packages" | "Beautiful Numbers";
  logo?: string;
  is_active?: boolean;
  stock_quantity?: number;
  validity_days?: number;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const products: Product[] = [
// MPT Products
{
  id: 1,
  name: "1GB Data Pack",
  description: "High-speed internet for 30 days",
  price: 3000,
  currency: "MMK",
  operator: "MPT",
  category: "Data"
},
{
  id: 2,
  name: "5GB Data Pack",
  description: "Extended data bundle for heavy users",
  price: 12000,
  currency: "MMK",
  operator: "MPT",
  category: "Data"
},
{
  id: 3,
  name: "100 Minutes Pack",
  description: "Talk time for local calls",
  price: 2500,
  currency: "MMK",
  operator: "MPT",
  category: "Minutes"
},
{
  id: 4,
  name: "Combo Package",
  description: "2GB data + 50 minutes + 100 SMS",
  price: 8000,
  currency: "MMK",
  operator: "MPT",
  category: "Packages"
},

// OOREDOO Products
{
  id: 5,
  name: "2GB SuperNet",
  description: "Fast 4G data for streaming",
  price: 5500,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Data"
},
{
  id: 6,
  name: "10GB Ultimate",
  description: "Ultimate data experience",
  price: 20000,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Data"
},
{
  id: 7,
  name: "200 Minutes Plus",
  description: "Extended talk time package",
  price: 4500,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Minutes"
},
{
  id: 8,
  name: "09-123-456-789",
  description: "Premium number with easy pattern",
  price: 150000,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Beautiful Numbers"
},

// ATOM Products
{
  id: 9,
  name: "3GB Speed Pack",
  description: "Perfect for social media",
  price: 7000,
  currency: "MMK",
  operator: "ATOM",
  category: "Data"
},
{
  id: 10,
  name: "1000 Reward Points",
  description: "Redeem for exclusive offers",
  price: 5000,
  currency: "MMK",
  operator: "ATOM",
  category: "Points"
},
{
  id: 11,
  name: "09-888-888-888",
  description: "VIP number with lucky 8s",
  price: 500000,
  currency: "MMK",
  operator: "ATOM",
  category: "Beautiful Numbers"
},

// MYTEL Products
{
  id: 12,
  name: "1.5GB Smart Pack",
  description: "Affordable data solution",
  price: 3500,
  currency: "MMK",
  operator: "MYTEL",
  category: "Data"
},
{
  id: 13,
  name: "150 Minutes Value",
  description: "Great value talk time",
  price: 3000,
  currency: "MMK",
  operator: "MYTEL",
  category: "Minutes"
},
{
  id: 14,
  name: "500 Bonus Points",
  description: "Loyalty rewards program",
  price: 2500,
  currency: "MMK",
  operator: "MYTEL",
  category: "Points"
},
{
  id: 15,
  name: "Family Package",
  description: "5GB shared + unlimited family calls",
  price: 15000,
  currency: "MMK",
  operator: "MYTEL",
  category: "Packages"
}];


export const operators = ["MPT", "OOREDOO", "ATOM", "MYTEL"] as const;
export const categories = ["Data", "Minutes", "Points", "Packages", "Beautiful Numbers"] as const;

export type Operator = typeof operators[number];
export type Category = typeof categories[number];