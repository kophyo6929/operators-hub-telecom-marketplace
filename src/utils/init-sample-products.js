// Sample products initialization script
// This can be run once to populate the database with sample products

const sampleProducts = [
// MPT Products
{
  name: "1GB Data Pack",
  description: "High-speed internet for 30 days",
  price: 3000,
  currency: "MMK",
  operator: "MPT",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 1000,
  validity_days: 30,
  admin_notes: "Popular data package for casual users"
},
{
  name: "5GB Data Pack",
  description: "Extended data bundle for heavy users",
  price: 12000,
  currency: "MMK",
  operator: "MPT",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 500,
  validity_days: 30,
  admin_notes: "Best value data package"
},
{
  name: "100 Minutes Pack",
  description: "Talk time for local calls",
  price: 2500,
  currency: "MMK",
  operator: "MPT",
  category: "Minutes",
  logo: "",
  is_active: true,
  stock_quantity: 2000,
  validity_days: 30,
  admin_notes: "Basic voice package"
},
{
  name: "Combo Package",
  description: "2GB data + 50 minutes + 100 SMS",
  price: 8000,
  currency: "MMK",
  operator: "MPT",
  category: "Packages",
  logo: "",
  is_active: true,
  stock_quantity: 300,
  validity_days: 30,
  admin_notes: "Complete communication package"
},

// OOREDOO Products
{
  name: "2GB SuperNet",
  description: "Fast 4G data for streaming",
  price: 5500,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 800,
  validity_days: 30,
  admin_notes: "Premium streaming package"
},
{
  name: "10GB Ultimate",
  description: "Ultimate data experience",
  price: 20000,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 100,
  validity_days: 30,
  admin_notes: "Power user package"
},
{
  name: "200 Minutes Plus",
  description: "Extended talk time package",
  price: 4500,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Minutes",
  logo: "",
  is_active: true,
  stock_quantity: 1500,
  validity_days: 30,
  admin_notes: "Extended voice package"
},
{
  name: "09-123-456-789",
  description: "Premium number with easy pattern",
  price: 150000,
  currency: "MMK",
  operator: "OOREDOO",
  category: "Beautiful Numbers",
  logo: "",
  is_active: true,
  stock_quantity: 1,
  validity_days: 0,
  admin_notes: "Exclusive premium number"
},

// ATOM Products
{
  name: "3GB Speed Pack",
  description: "Perfect for social media",
  price: 7000,
  currency: "MMK",
  operator: "ATOM",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 600,
  validity_days: 30,
  admin_notes: "Social media optimized"
},
{
  name: "1000 Reward Points",
  description: "Redeem for exclusive offers",
  price: 5000,
  currency: "MMK",
  operator: "ATOM",
  category: "Points",
  logo: "",
  is_active: true,
  stock_quantity: 2000,
  validity_days: 365,
  admin_notes: "Loyalty program credits"
},
{
  name: "09-888-888-888",
  description: "VIP number with lucky 8s",
  price: 500000,
  currency: "MMK",
  operator: "ATOM",
  category: "Beautiful Numbers",
  logo: "",
  is_active: true,
  stock_quantity: 1,
  validity_days: 0,
  admin_notes: "Ultra premium VIP number"
},

// MYTEL Products
{
  name: "1.5GB Smart Pack",
  description: "Affordable data solution",
  price: 3500,
  currency: "MMK",
  operator: "MYTEL",
  category: "Data",
  logo: "",
  is_active: true,
  stock_quantity: 1200,
  validity_days: 30,
  admin_notes: "Budget-friendly data option"
},
{
  name: "150 Minutes Value",
  description: "Great value talk time",
  price: 3000,
  currency: "MMK",
  operator: "MYTEL",
  category: "Minutes",
  logo: "",
  is_active: true,
  stock_quantity: 1800,
  validity_days: 30,
  admin_notes: "Value voice package"
},
{
  name: "500 Bonus Points",
  description: "Loyalty rewards program",
  price: 2500,
  currency: "MMK",
  operator: "MYTEL",
  category: "Points",
  logo: "",
  is_active: true,
  stock_quantity: 3000,
  validity_days: 180,
  admin_notes: "Customer loyalty rewards"
},
{
  name: "Family Package",
  description: "5GB shared + unlimited family calls",
  price: 15000,
  currency: "MMK",
  operator: "MYTEL",
  category: "Packages",
  logo: "",
  is_active: true,
  stock_quantity: 200,
  validity_days: 30,
  admin_notes: "Family sharing package"
}];


async function insertSampleProducts() {
  const now = new Date().toISOString();

  for (const product of sampleProducts) {
    try {
      const { error } = await window.ezsite.apis.tableCreate(44172, {
        ...product,
        created_at: now,
        updated_at: now
      });

      if (error) {
        console.error(`Failed to create product ${product.name}:`, error);
      } else {
        console.log(`Created product: ${product.name}`);
      }
    } catch (error) {
      console.error(`Error creating product ${product.name}:`, error);
    }
  }

  console.log('Sample products insertion completed!');
}

// Export for use in development
if (typeof window !== 'undefined') {
  window.insertSampleProducts = insertSampleProducts;
}