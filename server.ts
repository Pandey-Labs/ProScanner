import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock DB for preview environment if MONGO_URI is not provided
const mockDb = {
  tenants: [],
  users: [],
  products: [],
  sales: [],
  customers: []
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mock API endpoints for the prototype
app.get('/api/v1/products', (req, res) => {
  res.json(mockDb.products);
});

app.post('/api/v1/products', (req, res) => {
  const product = { ...req.body, _id: Math.random().toString(36).substr(2, 9), created_at: new Date() };
  mockDb.products.push(product);
  res.json(product);
});

app.post('/api/v1/sales', (req, res) => {
  const sale = { ...req.body, _id: Math.random().toString(36).substr(2, 9), created_at: new Date() };
  mockDb.sales.push(sale);
  
  // Update stock
  sale.products.forEach((p: any) => {
    const product = mockDb.products.find((prod: any) => prod._id === p.product_id);
    if (product) {
      product.stock_quantity -= p.quantity;
    }
  });
  
  res.json(sale);
});

app.get('/api/v1/sales', (req, res) => {
  res.json(mockDb.sales);
});

app.get('/api/v1/analytics', (req, res) => {
  const totalRevenue = mockDb.sales.reduce((sum: number, sale: any) => sum + sale.grand_total, 0);
  const totalSales = mockDb.sales.length;
  res.json({
    totalRevenue,
    totalSales,
    recentSales: mockDb.sales.slice(-5).reverse()
  });
});

async function startServer() {
  // Connect to MongoDB if URI is provided
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.log('No MONGO_URI provided, using mock in-memory database for preview.');
    
    // Seed some mock data
    mockDb.products.push(
      { _id: '1', name: 'Coca Cola 500ml', barcode: '123456789012', price: 2.50, stock_quantity: 100, category: 'Beverages' },
      { _id: '2', name: 'Lays Classic', barcode: '098765432109', price: 1.50, stock_quantity: 50, category: 'Snacks' },
      { _id: '3', name: 'Water Bottle 1L', barcode: '111222333444', price: 1.00, stock_quantity: 200, category: 'Beverages' }
    );
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
