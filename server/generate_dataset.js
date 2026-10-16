import fs from 'fs';
import path from 'path';
import { memoryStore } from './config/store.js';

const datasetDir = path.resolve(process.cwd(), 'dataset');
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}

// 1. Clean Users (omit bcrypt hashes for security/clarity in open dataset, provide sample plain role)
const sanitizedUsers = memoryStore.users.map(u => ({
  user_id: u._id,
  name: u.name,
  email: u.email,
  role: u.isAdmin ? 'Admin' : 'Customer',
  is_admin: u.isAdmin,
  created_at: u.createdAt,
}));

// 2. Categories
const categories = memoryStore.categories.map(c => ({
  category_id: c._id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  product_count: memoryStore.products.filter(p => p.category === c.name).length,
}));

// 3. Products
const products = memoryStore.products.map(p => ({
  product_id: p._id,
  name: p.name,
  category: p.category,
  price_inr: p.price,
  count_in_stock: p.countInStock,
  rating: p.rating,
  reviews_count: p.reviewsCount,
  featured: p.featured,
  image_url: p.image,
  description: p.description,
  specifications: p.details,
  reviews: p.reviews,
}));

// 4. Flattened Reviews
const reviews = [];
memoryStore.products.forEach(p => {
  if (p.reviews && p.reviews.length > 0) {
    p.reviews.forEach(r => {
      reviews.push({
        review_id: r._id || r.id,
        product_id: p._id,
        product_name: p.name,
        user_name: r.userName,
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt || r.date || '2026-10-01',
      });
    });
  }
});

// 5. Orders
const orders = memoryStore.orders.map(o => ({
  order_id: o._id,
  order_number: o.orderNumber,
  customer_id: o.user,
  customer_name: o.shippingAddress?.name || 'Customer',
  customer_email: o.shippingAddress?.email || '',
  customer_city: o.shippingAddress?.city || '',
  customer_state: o.shippingAddress?.state || '',
  customer_postal_code: o.shippingAddress?.postalCode || '',
  payment_method: o.paymentMethod,
  subtotal_inr: o.subtotal,
  shipping_inr: o.shippingPrice,
  tax_inr: o.taxPrice,
  total_inr: o.totalPrice,
  status: o.status,
  is_paid: o.isPaid,
  created_at: o.createdAt,
  items: o.orderItems,
}));

// Helper to write JSON
const writeJSON = (filename, data) => {
  const filePath = path.join(datasetDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Created ${filename} (${data.length || Object.keys(data).length} records)`);
};

// Helper for CSV escaping
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper to convert array of objects to CSV
const writeCSV = (filename, headers, rows) => {
  const filePath = path.join(datasetDir, filename);
  const headerLine = headers.map(h => escapeCSV(h.label)).join(',');
  const rowLines = rows.map(row => headers.map(h => escapeCSV(row[h.key])).join(','));
  const content = [headerLine, ...rowLines].join('\n');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Created ${filename} (${rows.length} rows)`);
};

// Write JSON datasets
writeJSON('products.json', products);
writeJSON('categories.json', categories);
writeJSON('users.json', sanitizedUsers);
writeJSON('reviews.json', reviews);
writeJSON('orders.json', orders);
writeJSON('ecommerce_full_dataset.json', {
  dataset_name: 'AURA E-Commerce Management System Dataset',
  version: '1.0.0',
  currency: 'INR (₹)',
  exported_at: new Date().toISOString(),
  categories,
  products,
  users: sanitizedUsers,
  reviews,
  orders,
});

// Write CSV datasets
writeCSV(
  'products.csv',
  [
    { key: 'product_id', label: 'Product_ID' },
    { key: 'name', label: 'Product_Name' },
    { key: 'category', label: 'Category' },
    { key: 'price_inr', label: 'Price_INR' },
    { key: 'count_in_stock', label: 'Count_In_Stock' },
    { key: 'rating', label: 'Rating' },
    { key: 'reviews_count', label: 'Reviews_Count' },
    { key: 'featured', label: 'Is_Featured' },
    { key: 'description', label: 'Description' },
    { key: 'image_url', label: 'Image_URL' },
  ],
  products
);

writeCSV(
  'categories.csv',
  [
    { key: 'category_id', label: 'Category_ID' },
    { key: 'name', label: 'Category_Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'description', label: 'Description' },
    { key: 'product_count', label: 'Product_Count' },
  ],
  categories
);

writeCSV(
  'users.csv',
  [
    { key: 'user_id', label: 'User_ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'is_admin', label: 'Is_Admin' },
    { key: 'created_at', label: 'Created_At' },
  ],
  sanitizedUsers
);

writeCSV(
  'reviews.csv',
  [
    { key: 'review_id', label: 'Review_ID' },
    { key: 'product_id', label: 'Product_ID' },
    { key: 'product_name', label: 'Product_Name' },
    { key: 'user_name', label: 'User_Name' },
    { key: 'rating', label: 'Rating' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_at', label: 'Created_At' },
  ],
  reviews
);

writeCSV(
  'orders.csv',
  [
    { key: 'order_id', label: 'Order_ID' },
    { key: 'order_number', label: 'Order_Number' },
    { key: 'customer_id', label: 'Customer_ID' },
    { key: 'customer_name', label: 'Customer_Name' },
    { key: 'customer_email', label: 'Customer_Email' },
    { key: 'customer_city', label: 'City' },
    { key: 'customer_state', label: 'State' },
    { key: 'customer_postal_code', label: 'Postal_Code' },
    { key: 'payment_method', label: 'Payment_Method' },
    { key: 'subtotal_inr', label: 'Subtotal_INR' },
    { key: 'shipping_inr', label: 'Shipping_INR' },
    { key: 'tax_inr', label: 'Tax_INR' },
    { key: 'total_inr', label: 'Total_INR' },
    { key: 'status', label: 'Status' },
    { key: 'is_paid', label: 'Is_Paid' },
    { key: 'created_at', label: 'Created_At' },
  ],
  orders
);

// Write Data Dictionary README
const readmeContent = `# AURA E-Commerce Management System - Dataset

## Overview
This dataset contains the complete catalog, categories, users, orders, and customer review data from the **AURA E-Commerce Management System**.

- **Currency**: Indian Rupee (INR - ₹)
- **Format**: JSON and CSV files
- **Use Cases**: Data Science analysis, Machine Learning (recommender systems, review sentiment analysis), database seeding (MongoDB/PostgreSQL/MySQL), Business Intelligence (PowerBI, Tableau, Excel).

---

## File Structure

| File | Format | Records | Description |
| :--- | :--- | :--- | :--- |
| \`ecommerce_full_dataset.json\` | JSON | Unified | Master dataset containing all entities in hierarchical format |
| \`products.json\` | JSON | 8 | Complete product records with specifications and nested reviews |
| \`products.csv\` | CSV | 8 | Tabular product records (ID, Name, Category, Price, Stock, Rating, Image) |
| \`categories.json\` | JSON | 5 | E-commerce taxonomy and descriptions |
| \`categories.csv\` | CSV | 5 | Tabular categories with product counts |
| \`users.json\` | JSON | 2 | Sanitized customer and administrative profiles |
| \`users.csv\` | CSV | 2 | Tabular user roles and account creation timestamps |
| \`orders.json\` | JSON | 1 | Complete transaction histories with nested shipping and order items |
| \`orders.csv\` | CSV | 1 | Flat transaction records with financial summaries and fulfillment statuses |
| \`reviews.json\` | JSON | 6 | Flattened customer review sentiments and star ratings |
| \`reviews.csv\` | CSV | 6 | Tabular review records mapped to product IDs |

---

## Schema & Data Dictionary

### 1. Products (\`products.csv\` / \`products.json\`)
- **Product_ID** (\`string\`): Unique identifier for the product.
- **Product_Name** (\`string\`): Commercial product title.
- **Category** (\`string\`): Product category taxonomy (\`Audio\`, \`Wearables\`, \`Desk Setup\`, \`Photography\`, \`Home Living\`).
- **Price_INR** (\`number\`): Retail price in Indian Rupees (₹).
- **Count_In_Stock** (\`integer\`): Current inventory count.
- **Rating** (\`number\`): Average star rating (1.0 to 5.0 scale).
- **Reviews_Count** (\`integer\`): Total number of customer reviews.
- **Is_Featured** (\`boolean\`): Whether product is spotlighted on the home showcase.
- **Description** (\`string\`): Detailed product overview and narrative.
- **Image_URL** (\`string\`): High-resolution Unsplash catalog image URL.
- **Specifications** (\`array\` in JSON): Bulleted hardware and design specifications.

### 2. Categories (\`categories.csv\` / \`categories.json\`)
- **Category_ID** (\`string\`): Category unique key.
- **Category_Name** (\`string\`): Display name.
- **Slug** (\`string\`): URL-friendly slug identifier.
- **Description** (\`string\`): Category purpose and styling focus.
- **Product_Count** (\`integer\`): Total products in this category.

### 3. Users (\`users.csv\` / \`users.json\`)
- **User_ID** (\`string\`): User identifier.
- **Name** (\`string\`): Full user name.
- **Email** (\`string\`): Contact email address.
- **Role** (\`string\`): Account permission level (\`Admin\` or \`Customer\`).
- **Is_Admin** (\`boolean\`): Administrative privileges flag.
- **Created_At** (\`ISO 8601 string\`): Registration timestamp.

### 4. Orders (\`orders.csv\` / \`orders.json\`)
- **Order_ID** (\`string\`): Internal MongoDB identifier.
- **Order_Number** (\`string\`): Human-readable receipt reference (e.g. \`ORD-729103\`).
- **Customer_ID** (\`string\`): Foreign key referencing \`User_ID\`.
- **Subtotal_INR**, **Shipping_INR**, **Tax_INR**, **Total_INR** (\`numbers\`): Financial amounts breakdown.
- **Payment_Method** (\`string\`): \`card\`, \`upi\`, or \`cod\`.
- **Status** (\`string\`): Fulfillment status (\`Processing\`, \`Shipped\`, \`Delivered\`, \`Cancelled\`).
- **Is_Paid** (\`boolean\`): Payment settlement indicator.

### 5. Reviews (\`reviews.csv\` / \`reviews.json\`)
- **Review_ID** (\`string\`): Unique review record identifier.
- **Product_ID** (\`string\`): Linked product ID.
- **User_Name** (\`string\`): Reviewer display name.
- **Rating** (\`number\`): Review score (1 to 5).
- **Comment** (\`string\`): Qualitative customer feedback text.
- **Created_At** (\`string\`): Date of publication.
`;

fs.writeFileSync(path.join(datasetDir, 'README.md'), readmeContent, 'utf-8');
console.log('Created README.md with comprehensive data dictionary.');
