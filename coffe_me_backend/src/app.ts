import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemsRoutes from './routes/items.routes';
import ordersRoutes from './routes/orders.routes';
import tablesRoutes from './routes/tables.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { config } from './config/env';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (config.nodeEnv === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
  }
  next();
});

// Routes
app.use('/api/items', itemsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`💾 Database: ${config.databaseUrl ? 'Configured' : 'Not configured'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/items`);
  console.log(`   GET    /api/orders`);
  console.log(`   GET    /api/tables`);
  console.log(`   GET    /api/settings`);
  console.log(`\n💡 Make sure to run: npx prisma migrate dev`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
