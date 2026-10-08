import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import ApiError from './utils/apiError.js';

const app = express();

// Middlewares
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // In development or production, allow incoming origin (returns origin header so credentials work on any network device)
//       callback(null, true);
//     },
//     credentials: true,
//   })
// );
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads (/uploads/YYYY/MM/filename.jpg)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', (req, res) => {
  res.redirect(301, `https://educationmasters.in/uploads${req.url}`);
});

// Unconditional Logging
app.use(morgan('dev'));
app.use(requestLogger);

// Root Backend Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: 'Welcome to Education Masters Backend API Server',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apis: '/apis',
      api: '/api',
      apiV1: '/api/v1',
      apisV1: '/apis/v1',
    },
  });
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Education Masters Backend service is operational',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// API Routes (support both /api/v1 and /apis/v1)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);
app.use('/apis/v1', apiRoutes);
app.use('/apis', apiRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Central Error Handler
app.use(errorHandler);

export default app;
