import express from 'express';
import {
  getBackupManifest,
  exportSpecificModel,
  exportBulkModels,
  exportZipArchive,
} from '../controllers/backup.controller.js';
import { optionalAuth, protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Allow authenticated admin/superadmin with optionalAuth fallback for localhost development
router.get('/manifest', optionalAuth, getBackupManifest);
router.get('/export/:modelKey', optionalAuth, exportSpecificModel);
router.post('/export-bulk', optionalAuth, exportBulkModels);
router.get('/export-bulk', optionalAuth, exportBulkModels);

// ZIP Partitioned Backup Endpoints
router.get('/export-zip', optionalAuth, exportZipArchive);
router.post('/export-zip', optionalAuth, exportZipArchive);

export default router;
