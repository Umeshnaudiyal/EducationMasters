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
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
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

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Education Masters Backend service is up and running' });
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
