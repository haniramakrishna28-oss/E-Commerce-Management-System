import Category from '../models/Category.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

export const getCategories = async (req, res) => {
  try {
    if (getIsMongooseConnected()) {
      const categories = await Category.find();
      return res.json(categories);
    } else {
      return res.json(memoryStore.categories);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    if (getIsMongooseConnected()) {
      const category = await Category.create({ name, slug, description });
      return res.status(201).json(category);
    } else {
      const newCat = {
        _id: 'cat-' + Date.now(),
        name,
        slug,
        description,
      };
      memoryStore.categories.push(newCat);
      return res.status(201).json(newCat);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};
