import express from 'express';
import { getSitemapIndexData, getSitemapUrlsData } from '../controllers/sitemap.controller.js';
import { cacheResponse } from '../middlewares/cache.middleware.js';

const router = express.Router();

router.get('/index', cacheResponse(600), getSitemapIndexData);
router.get('/urls/:type', cacheResponse(600), getSitemapUrlsData);

export default router;
