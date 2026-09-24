import express from 'express';
import {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState,
  bulkActionStates,
  getDistricts,
  getDistrictsByState,
  getPublicStateProfile,
} from '../controllers/state.controller.js';
import { verifyToken, checkRole, optionalAuth } from '../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';

const router = express.Router();
const STATE_CACHE_PATTERNS = ['state*', 'district*', 'search*'];

router.get('/', cacheResponse(1800), getStates);
router.get('/districts', cacheResponse(1800), getDistricts);
router.get('/public/:slug', cacheResponse(1800), getPublicStateProfile);
router.get('/:slug/public', cacheResponse(1800), getPublicStateProfile);
router.get('/:stateId/districts', cacheResponse(1800), getDistrictsByState);
router.get('/:id', cacheResponse(1800), getStateById);

router.post('/bulk', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), bulkActionStates);
router.post('/bulk-action', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), bulkActionStates);
router.post('/bulk-delete', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), bulkActionStates);
router.delete('/bulk', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), bulkActionStates);
router.post('/', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), createState);
router.put('/:id', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), updateState);
router.delete('/:id', optionalAuth, invalidateCache(...STATE_CACHE_PATTERNS), deleteState);

export default router;
