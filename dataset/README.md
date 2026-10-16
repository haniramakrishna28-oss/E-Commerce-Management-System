# AURA E-Commerce Management System - Dataset

## Overview
This dataset contains the complete catalog, categories, users, orders, and customer review data from the **AURA E-Commerce Management System**.

- **Currency**: Indian Rupee (INR - ₹)
- **Format**: JSON and CSV files
- **Use Cases**: Data Science analysis, Machine Learning (recommender systems, review sentiment analysis), database seeding (MongoDB/PostgreSQL/MySQL), Business Intelligence (PowerBI, Tableau, Excel).

---

## File Structure

| File | Format | Records | Description |
| :--- | :--- | :--- | :--- |
| `ecommerce_full_dataset.json` | JSON | Unified | Master dataset containing all entities in hierarchical format |
| `products.json` | JSON | 8 | Complete product records with specifications and nested reviews |
| `products.csv` | CSV | 8 | Tabular product records (ID, Name, Category, Price, Stock, Rating, Image) |
| `categories.json` | JSON | 5 | E-commerce taxonomy and descriptions |
| `categories.csv` | CSV | 5 | Tabular categories with product counts |
| `users.json` | JSON | 2 | Sanitized customer and administrative profiles |
| `users.csv` | CSV | 2 | Tabular user roles and account creation timestamps |
| `orders.json` | JSON | 1 | Complete transaction histories with nested shipping and order items |
| `orders.csv` | CSV | 1 | Flat transaction records with financial summaries and fulfillment statuses |
| `reviews.json` | JSON | 6 | Flattened customer review sentiments and star ratings |
| `reviews.csv` | CSV | 6 | Tabular review records mapped to product IDs |

---

## Schema & Data Dictionary

### 1. Products (`products.csv` / `products.json`)
- **Product_ID** (`string`): Unique identifier for the product.
- **Product_Name** (`string`): Commercial product title.
- **Category** (`string`): Product category taxonomy (`Audio`, `Wearables`, `Desk Setup`, `Photography`, `Home Living`).
- **Price_INR** (`number`): Retail price in Indian Rupees (₹).
- **Count_In_Stock** (`integer`): Current inventory count.
- **Rating** (`number`): Average star rating (1.0 to 5.0 scale).
- **Reviews_Count** (`integer`): Total number of customer reviews.
- **Is_Featured** (`boolean`): Whether product is spotlighted on the home showcase.
- **Description** (`string`): Detailed product overview and narrative.
- **Image_URL** (`string`): High-resolution Unsplash catalog image URL.
- **Specifications** (`array` in JSON): Bulleted hardware and design specifications.

### 2. Categories (`categories.csv` / `categories.json`)
- **Category_ID** (`string`): Category unique key.
- **Category_Name** (`string`): Display name.
- **Slug** (`string`): URL-friendly slug identifier.
- **Description** (`string`): Category purpose and styling focus.
- **Product_Count** (`integer`): Total products in this category.

### 3. Users (`users.csv` / `users.json`)
- **User_ID** (`string`): User identifier.
- **Name** (`string`): Full user name.
- **Email** (`string`): Contact email address.
- **Role** (`string`): Account permission level (`Admin` or `Customer`).
- **Is_Admin** (`boolean`): Administrative privileges flag.
- **Created_At** (`ISO 8601 string`): Registration timestamp.

### 4. Orders (`orders.csv` / `orders.json`)
- **Order_ID** (`string`): Internal MongoDB identifier.
- **Order_Number** (`string`): Human-readable receipt reference (e.g. `ORD-729103`).
- **Customer_ID** (`string`): Foreign key referencing `User_ID`.
- **Subtotal_INR**, **Shipping_INR**, **Tax_INR**, **Total_INR** (`numbers`): Financial amounts breakdown.
- **Payment_Method** (`string`): `card`, `upi`, or `cod`.
- **Status** (`string`): Fulfillment status (`Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **Is_Paid** (`boolean`): Payment settlement indicator.

### 5. Reviews (`reviews.csv` / `reviews.json`)
- **Review_ID** (`string`): Unique review record identifier.
- **Product_ID** (`string`): Linked product ID.
- **User_Name** (`string`): Reviewer display name.
- **Rating** (`number`): Review score (1 to 5).
- **Comment** (`string`): Qualitative customer feedback text.
- **Created_At** (`string`): Date of publication.
