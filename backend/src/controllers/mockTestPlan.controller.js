import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { MockTestPlan } from '../models/index.js';
import { slugify } from '../utils/slug.js';

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await MockTestPlan.find({ status: 'active' }).sort({ order: 1, price: 1 }).lean();
  res.status(200).json(new ApiResponse(200, plans, 'Plans retrieved successfully'));
});

export const getAllPlansAdmin = asyncHandler(async (req, res) => {
  const plans = await MockTestPlan.find({}).sort({ order: 1, createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, plans, 'All plans retrieved successfully'));
});

export const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    tagline,
    price,
    original_price,
    validity,
    validity_days,
    is_free,
    is_popular,
    badge,
    features,
    button_text,
    status,
    order,
  } = req.body;

  const errors = {};
  if (!name || !name.trim()) {
    errors.name = 'Plan name is required';
  }

  const cleanSlug = slug ? slugify(slug) : name ? slugify(name) : '';
  if (!cleanSlug) {
    errors.slug = 'Valid plan slug is required';
  }

  if (price === undefined || price === null || isNaN(Number(price))) {
    errors.price = 'Valid price is required (0 for free)';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  const existing = await MockTestPlan.findOne({ slug: cleanSlug });
  if (existing) {
    throw new ApiError(409, `A pricing plan with slug "${cleanSlug}" already exists`, {
      slug: `The slug "${cleanSlug}" is already in use. Please enter a different slug.`,
    });
  }

  const parsedPrice = Number(price) || 0;
  const parsedOriginalPrice = Number(original_price) || 0;
  const isFreePlan = is_free !== undefined ? Boolean(is_free) : parsedPrice === 0;

  const plan = await MockTestPlan.create({
    name: name.trim(),
    slug: cleanSlug,
    tagline: tagline || '',
    price: parsedPrice,
    original_price: parsedOriginalPrice,
    validity: validity || '1 Year',
    validity_days: Number(validity_days) || 365,
    is_free: isFreePlan,
    is_popular: Boolean(is_popular),
    badge: badge || (isFreePlan ? '100% FREE' : is_popular ? 'MOST POPULAR' : ''),
    features: Array.isArray(features) ? features.filter((f) => f && f.trim()) : [],
    button_text: button_text || (isFreePlan ? 'Select Free Plan' : `Select ₹${parsedPrice} Plan`),
    status: status || 'active',
    order: Number(order) || 0,
  });

  res.status(201).json(new ApiResponse(201, plan, 'Pricing plan created successfully'));
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await MockTestPlan.findById(id);
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }

  const {
    name,
    slug,
    tagline,
    price,
    original_price,
    validity,
    validity_days,
    is_free,
    is_popular,
    badge,
    features,
    button_text,
    status,
    order,
  } = req.body;

  const errors = {};
  if (name !== undefined && !name.trim()) {
    errors.name = 'Plan name cannot be empty';
  }

  if (slug !== undefined) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) {
      errors.slug = 'Valid plan slug is required';
    } else if (cleanSlug !== plan.slug) {
      const existing = await MockTestPlan.findOne({ slug: cleanSlug, _id: { $ne: plan._id } });
      if (existing) {
        errors.slug = `The slug "${cleanSlug}" is already taken by another plan.`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, Object.values(errors)[0], errors);
  }

  if (name !== undefined) plan.name = name.trim();
  if (slug !== undefined && slug.trim()) plan.slug = slugify(slug);
  if (tagline !== undefined) plan.tagline = tagline;
  if (price !== undefined) {
    plan.price = Number(price) || 0;
    if (is_free === undefined) {
      plan.is_free = plan.price === 0;
    }
  }
  if (original_price !== undefined) plan.original_price = Number(original_price) || 0;
  if (validity !== undefined) plan.validity = validity;
  if (validity_days !== undefined) plan.validity_days = Number(validity_days) || 365;
  if (is_free !== undefined) plan.is_free = Boolean(is_free);
  if (is_popular !== undefined) plan.is_popular = Boolean(is_popular);
  if (badge !== undefined) plan.badge = badge;
  if (features !== undefined && Array.isArray(features)) {
    plan.features = features.filter((f) => f && f.trim());
  }
  if (button_text !== undefined) plan.button_text = button_text;
  if (status !== undefined) plan.status = status;
  if (order !== undefined) plan.order = Number(order);

  await plan.save();
  res.status(200).json(new ApiResponse(200, plan, 'Pricing plan updated successfully'));
});

export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await MockTestPlan.findByIdAndDelete(id);
  res.status(200).json(new ApiResponse(200, null, 'Plan deleted successfully'));
});
