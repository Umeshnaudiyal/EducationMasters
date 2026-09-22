import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Country, State } from '../models/index.js';
import { validateUniqueSlug, slugify } from '../utils/slug.js';

// Default list of world countries for seeding if needed
const DEFAULT_COUNTRIES = [
  { name: 'India', code: 'IN', slug: 'india', phone_code: '+91', sql_id: 1 },
  { name: 'United States', code: 'US', slug: 'united-states', phone_code: '+1', sql_id: 2 },
  { name: 'United Kingdom', code: 'GB', slug: 'united-kingdom', phone_code: '+44', sql_id: 3 },
  { name: 'Canada', code: 'CA', slug: 'canada', phone_code: '+1', sql_id: 4 },
  { name: 'Australia', code: 'AU', slug: 'australia', phone_code: '+61', sql_id: 5 },
  { name: 'Germany', code: 'DE', slug: 'germany', phone_code: '+49', sql_id: 6 },
  { name: 'France', code: 'FR', slug: 'france', phone_code: '+33', sql_id: 7 },
  { name: 'Japan', code: 'JP', slug: 'japan', phone_code: '+81', sql_id: 8 },
  { name: 'Singapore', code: 'SG', slug: 'singapore', phone_code: '+65', sql_id: 9 },
  { name: 'United Arab Emirates', code: 'AE', slug: 'united-arab-emirates', phone_code: '+971', sql_id: 10 },
  { name: 'New Zealand', code: 'NZ', slug: 'new-zealand', phone_code: '+64', sql_id: 11 },
  { name: 'South Africa', code: 'ZA', slug: 'south-africa', phone_code: '+27', sql_id: 12 },
  { name: 'Russia', code: 'RU', slug: 'russia', phone_code: '+7', sql_id: 13 },
  { name: 'China', code: 'CN', slug: 'china', phone_code: '+86', sql_id: 14 },
  { name: 'Brazil', code: 'BR', slug: 'brazil', phone_code: '+55', sql_id: 15 },
  { name: 'Italy', code: 'IT', slug: 'italy', phone_code: '+39', sql_id: 16 },
  { name: 'Spain', code: 'ES', slug: 'spain', phone_code: '+34', sql_id: 17 },
  { name: 'Netherlands', code: 'NL', slug: 'netherlands', phone_code: '+31', sql_id: 18 },
  { name: 'Switzerland', code: 'CH', slug: 'switzerland', phone_code: '+41', sql_id: 19 },
  { name: 'Sweden', code: 'SE', slug: 'sweden', phone_code: '+46', sql_id: 20 },
  { name: 'Saudi Arabia', code: 'SA', slug: 'saudi-arabia', phone_code: '+966', sql_id: 21 },
  { name: 'Malaysia', code: 'MY', slug: 'malaysia', phone_code: '+60', sql_id: 22 },
  { name: 'Nepal', code: 'NP', slug: 'nepal', phone_code: '+977', sql_id: 23 },
  { name: 'Sri Lanka', code: 'LK', slug: 'sri-lanka', phone_code: '+94', sql_id: 24 },
  { name: 'Bangladesh', code: 'BD', slug: 'bangladesh', phone_code: '+880', sql_id: 25 },
  { name: 'Bhutan', code: 'BT', slug: 'bhutan', phone_code: '+975', sql_id: 26 },
  { name: 'Ireland', code: 'IE', slug: 'ireland', phone_code: '+353', sql_id: 27 },
];

export const getCountries = asyncHandler(async (req, res) => {
  const isAll = req.query.all === 'true' || req.query.all === true || !req.query.page;
  const search = (req.query.search || req.query.q || '').trim();

  // Auto seed if empty
  const count = await Country.countDocuments();
  if (count === 0) {
    for (const c of DEFAULT_COUNTRIES) {
      await Country.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true, new: true });
    }
  }

  const query = { name: { $exists: true, $ne: '' } };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
  }

  if (isAll) {
    const countries = await Country.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [countries, total] = await Promise.all([
    Country.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Country.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: countries,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getCountryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const country = isObjectId
    ? await Country.findById(id).lean()
    : await Country.findOne({ slug: id }).lean();

  if (!country) {
    throw new ApiError(404, 'Country not found');
  }

  res.status(200).json({
    success: true,
    data: country,
  });
});

export const createCountry = asyncHandler(async (req, res) => {
  const { name, code, phone_code } = req.body;
  if (!name || !String(name).trim()) {
    throw new ApiError(400, 'Country name is required');
  }

  const cleanName = String(name).trim();
  const slug = slugify(cleanName);

  const country = await Country.create({
    name: cleanName,
    code: code ? String(code).trim().toUpperCase() : undefined,
    slug,
    phone_code: phone_code ? String(phone_code).trim() : undefined,
  });

  res.status(201).json({
    success: true,
    message: 'Country created successfully',
    data: country,
  });
});

export const updateCountry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, phone_code } = req.body;

  const country = await Country.findById(id);
  if (!country) {
    throw new ApiError(404, 'Country not found');
  }

  if (name) country.name = String(name).trim();
  if (code !== undefined) country.code = String(code).trim().toUpperCase();
  if (phone_code !== undefined) country.phone_code = String(phone_code).trim();

  await country.save();

  res.status(200).json({
    success: true,
    message: 'Country updated successfully',
    data: country,
  });
});

export const deleteCountry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const country = await Country.findByIdAndDelete(id);

  if (!country) {
    throw new ApiError(404, 'Country not found');
  }

  res.status(200).json({
    success: true,
    message: 'Country deleted successfully',
  });
});
