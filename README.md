# AURA — Minimalist Full-Stack E-Commerce Management System

A production-ready Full-Stack E-Commerce platform designed with modern minimalist aesthetics, built on **React (Vite)**, **Node.js + Express**, and **MongoDB (Mongoose)** with **JWT Authentication** and role-based access control.

---

## 🌟 Architecture & Tech Stack

- **Frontend**: React 19 (Vite), React Router v7, Lucide Icons, Vanilla CSS Design System with 8px grid and Inter/Poppins typography.
- **Backend**: Node.js, Express, Mongoose ODM, JWT, bcryptjs password hashing.
- **Database**: MongoDB / MongoDB Atlas (with automatic zero-config persistent fallback).
- **Deployment**:
  - **Frontend**: Vercel / Netlify
  - **Backend**: Render / Railway
  - **Database**: MongoDB Atlas

---

## 📁 Project Structure

```text
E-commerce-Management system/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProductCard
│   │   ├── pages/              # Home, Products, ProductDetails, Cart, Checkout, Login, Orders, Wishlist, Admin
│   │   ├── context/            # AuthContext, CartContext, WishlistContext
│   │   ├── services/           # api.js, mockData.js
│   │   └── styles/             # index.css, variables.css
│   ├── index.html
│   └── vite.config.js
├── server/                     # Backend REST API
│   ├── config/                 # db.js, seed.js, store.js
│   ├── controllers/            # authController, productController, cartController, orderController, analyticsController
│   ├── middleware/             # authMiddleware.js (JWT protect & admin guards)
│   ├── models/                 # User.js, Product.js, Category.js, Cart.js, Order.js
│   ├── routes/                 # authRoutes, productRoutes, categoryRoutes, cartRoutes, orderRoutes, analyticsRoutes
│   ├── .env                    # Active environment variables
│   ├── .env.example            # Environment variables template
│   ├── server.js               # Main Express entrypoint
│   └── test_verification.js    # Automated validation test suite
├── package.json                # Root orchestration scripts
└── README.md                   # Complete documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ installed.
- **npm** installed.
- Optional: MongoDB Atlas cluster URI or local MongoDB.

### 2. Install Dependencies
Run the following commands:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
In `server/.env` (pre-configured from `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aura_ecommerce
JWT_SECRET=aura_super_secure_jwt_secret_key_2026
CLIENT_URL=http://localhost:5173
```

> **Note**: If you do not have a local MongoDB instance running, the backend automatically operates in persistent zero-config store mode so all APIs, user logins, cart, and orders work immediately. To connect to MongoDB Atlas, simply paste your connection string into `MONGO_URI`.

### 4. Running the Application

Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm start
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite runs on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aura.store` | `Admin123!` | Full Admin Console, Product CRUD, Stock Edits, Order Status Controls |
| **Customer** | `customer@aura.store` | `User123!` | Browsing, Wishlist, Cart, Checkout, Order Tracking |

*(Both accounts feature quick 1-click pre-fill buttons on the Login page).*

---

## 🧪 Testing & Validation

Execute the automated backend verification test suite:

```bash
cd server
node test_verification.js
```

### Verified Scenarios:
1. **Health Check**: Confirmed server responsiveness.
2. **Invalid Input Validation**: Rejection of malformed emails, short passwords (<6 chars), and empty fields with status 400.
3. **Authentication**: Bcrypt verification and JWT issuance for Admin & Customer.
4. **Admin Protection**: Non-admin users are strictly blocked with 403 Forbidden on protected endpoints.
5. **Inventory Limitations**: Orders exceeding available stock are blocked with 400 Insufficient Stock.
6. **Stock Reduction**: Stock count automatically decrements upon successful order creation.
7. **Order Status Progression**: Order Placed → Confirmed → Shipped → Delivered → Cancelled.
8. **Customer Reviews**: Rating calculation and feedback submissions.

---

## 🌐 Production Deployment Steps

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (`0.0.0.0/0`).
3. Copy your connection string into `server/.env`:
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/aura_ecommerce?retryWrites=true&w=majority
   ```
4. Run `npm --prefix server run seed` to seed your Atlas database.

### 2. Backend (Render / Railway)
1. Push repository to GitHub.
2. Create a new Web Service on [Render](https://render.com).
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=<your-atlas-uri>`
   - `JWT_SECRET=<your-secret>`
   - `CLIENT_URL=<your-frontend-deployment-url>`

### 3. Frontend (Vercel / Netlify)
1. Create a new Project on [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set **Root Directory** to `client`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variable:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
6. Deploy!
