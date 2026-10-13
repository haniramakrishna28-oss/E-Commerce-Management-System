import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { memoryStore } from './store.js';

dotenv.config();

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

    // Insert users (passwords are already hashed in memoryStore or will be hashed by Mongoose)
    const createdUsers = await User.insertMany(memoryStore.users);
    const adminUser = createdUsers[0]._id;

    // Insert categories
    await Category.insertMany(memoryStore.categories);

    // Insert products
    const sampleProducts = memoryStore.products.map(p => ({
      ...p,
      user: adminUser,
    }));
    await Product.insertMany(sampleProducts);

    console.log('[Seeder] Database seeded successfully with users, categories, and products!');
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
