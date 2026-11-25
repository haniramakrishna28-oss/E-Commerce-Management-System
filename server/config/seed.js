import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { memoryStore } from './store.js';

dotenv.config();

const sanitizeCategories = () =>
  memoryStore.categories.map(({ _id, ...rest }) => rest);

const sanitizeProducts = (adminUserId) =>
  memoryStore.products.map(({ reviews = [], ...p }) => ({
    ...p,
    user: adminUserId,
    reviews: reviews.map(({ _id, ...rev }) => rev),
  }));

export const seedIfEmpty = async () => {
  try {
    let adminUser = await User.findOne({ isAdmin: true });

    if ((await User.countDocuments()) === 0) {
      const createdUsers = await User.insertMany(memoryStore.users);
      adminUser = createdUsers.find((u) => u.isAdmin) || createdUsers[0];
      console.log(`[Seeder] Seeded ${createdUsers.length} users into MongoDB.`);
    }

    if ((await Category.countDocuments()) === 0) {
      const createdCategories = await Category.insertMany(sanitizeCategories());
      console.log(`[Seeder] Seeded ${createdCategories.length} categories into MongoDB.`);
    }

    if ((await Product.countDocuments()) === 0) {
      const sampleProducts = sanitizeProducts(adminUser?._id);
      const createdProducts = await Product.insertMany(sampleProducts);
      console.log(`[Seeder] Seeded ${createdProducts.length} products into MongoDB.`);
    }

    if ((await Order.countDocuments()) === 0 && memoryStore.orders.length > 0) {
      const createdOrders = await Order.insertMany(memoryStore.orders);
      console.log(`[Seeder] Seeded ${createdOrders.length} sample orders into MongoDB.`);
    }
  } catch (error) {
    console.warn(`[Seeder] Auto-seed skipped/failed: ${error.message}`);
  }
};

export const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/aura_ecommerce';
    await mongoose.connect(mongoURI);
    console.log('[Seeder] Connected to MongoDB for seeding...');

    // Clear existing collections
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    // Insert users (passwords are already hashed in memoryStore)
    const createdUsers = await User.insertMany(memoryStore.users);
    const adminUser = createdUsers[0]._id;

    // Insert categories
    await Category.insertMany(sanitizeCategories());

    // Insert products
    await Product.insertMany(sanitizeProducts(adminUser));

    // Insert sample orders
    if (memoryStore.orders.length > 0) {
      await Order.insertMany(memoryStore.orders);
    }

    console.log('[Seeder] Database seeded successfully with users, categories, products, and orders!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder] Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

// Check if executed directly via command line
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
