import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { Payment, User, MockTestSeries } from '../models/index.js';

// Helper to get initialized Razorpay instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Return instance with placeholder or test key if environment variables are not yet provided
    return new Razorpay({
      key_id: keyId || 'rzp_test_placeholder',
      key_secret: keySecret || 'placeholder_secret',
    });
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * 1. Create Razorpay Payment Order (or direct free activation if amount === 0)
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { plan, seriesId, seriesTitle, userName, userEmail, userPhone } = req.body;

  if (!plan || (!plan.name && !plan.price && plan.price !== 0)) {
    throw new ApiError(400, 'Invalid plan details provided');
  }

  const price = Number(plan.price) || 0;
  const planName = plan.name || 'Mock Test Pass';
  const validityDays = Number(plan.validity_days) || 365;

  // Resolve user info
  let user = req.user || null;
  const finalEmail = (userEmail || user?.email || '').toLowerCase().trim();
  const finalName = userName || user?.name || 'Aspirant';
  const finalPhone = userPhone || user?.phone || '';

  if (!user && finalEmail) {
    user = await User.findOne({ email: finalEmail });
  }

  // 1. FREE PLAN / ZERO AMOUNT PASS: Instant Activation without gateway
  if (price === 0 || plan.is_free) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    if (user) {
      user.subscription = {
        plan: planName,
        startDate: new Date(),
        expiryDate: expiryDate,
        isActive: true,
      };
      await user.save();
    }

    const freePayment = await Payment.create({
      user: user?._id || null,
      user_name: finalName,
      user_email: finalEmail,
      user_phone: finalPhone,
      series: seriesId || null,
      series_title: seriesTitle || '',
      plan: {
        id: plan.id || plan._id || 'free_plan',
        name: planName,
        slug: plan.slug || 'free-plan',
        price: 0,
        original_price: Number(plan.original_price) || 0,
        validity: plan.validity || '1 Year',
        validity_days: validityDays,
        badge: plan.badge || '100% FREE',
      },
      amount: 0,
      currency: 'INR',
      status: 'free_activated',
      payment_method: 'free',
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isFree: true,
          payment: freePayment,
          subscription: {
            plan: planName,
            startDate: new Date(),
            expiryDate: expiryDate,
            isActive: true,
          },
        },
        'Free pass activated successfully!'
      )
    );
  }

  // 2. PAID PLAN: Initialize Real Razorpay Order
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    throw new ApiError(
      400,
      'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env'
    );
  }

  const amountInPaise = Math.round(price * 100);
  const receiptId = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

  let order;
  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        planName,
        validityDays: String(validityDays),
        userEmail: finalEmail,
        userName: finalName,
        seriesId: String(seriesId || ''),
      },
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    throw new ApiError(
      400,
      `Razorpay Gateway Error: ${err?.error?.description || err.message || 'Authentication or Order creation failed'}`
    );
  }

  // Record initial payment attempt in database
  const paymentRecord = await Payment.create({
    user: user?._id || null,
    user_name: finalName,
    user_email: finalEmail,
    user_phone: finalPhone,
    series: seriesId || null,
    series_title: seriesTitle || '',
    plan: {
      id: plan.id || plan._id || 'pro_plan',
      name: planName,
      slug: plan.slug || 'pro-pass',
      price: price,
      original_price: Number(plan.original_price) || 0,
      validity: plan.validity || '1 Year',
      validity_days: validityDays,
      badge: plan.badge || '',
    },
    amount: price,
    currency: 'INR',
    razorpay_order_id: order.id,
    status: 'created',
    payment_method: 'razorpay',
    notes: order.notes || {},
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        paymentId: paymentRecord._id,
        plan: {
          name: planName,
          price: price,
          validity: plan.validity || '1 Year',
          validity_days: validityDays,
        },
        user: {
          name: finalName,
          email: finalEmail,
          phone: finalPhone,
        },
      },
      'Payment order created successfully'
    )
  );
});

/**
 * 2. Verify Razorpay Payment Signature & Unlock Pass
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    userEmail,
    userName,
    userId,
    seriesId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Missing required payment verification parameters');
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (keySecret) {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Update payment record to failed
      await Payment.findOneAndUpdate(
        { razorpay_order_id },
        {
          razorpay_payment_id,
          razorpay_signature,
          status: 'failed',
          error_message: 'Invalid signature verification',
        }
      );
      throw new ApiError(400, 'Payment verification failed: Signature mismatch');
    }
  }

  // Find payment record
  let paymentRecord = await Payment.findOne({ razorpay_order_id });
  if (!paymentRecord) {
    paymentRecord = await Payment.create({
      user: userId || null,
      user_name: userName || 'Student',
      user_email: userEmail || '',
      series: seriesId || null,
      plan: plan || { name: 'Pro Pass', price: 0 },
      amount: plan?.price || 0,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: 'paid',
    });
  } else {
    paymentRecord.razorpay_payment_id = razorpay_payment_id;
    paymentRecord.razorpay_signature = razorpay_signature;
    paymentRecord.status = 'paid';
    await paymentRecord.save();
  }

  // Unlock subscription for user
  const validityDays = Number(plan?.validity_days) || Number(paymentRecord?.plan?.validity_days) || 365;
  const planName = plan?.name || paymentRecord?.plan?.name || 'Pro Pass';

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);

  let targetUser = req.user || null;
  const searchEmail = (userEmail || paymentRecord.user_email || targetUser?.email || '').toLowerCase().trim();

  if (!targetUser && userId) {
    targetUser = await User.findById(userId);
  }
  if (!targetUser && searchEmail) {
    targetUser = await User.findOne({ email: searchEmail });
  }

  if (targetUser) {
    targetUser.subscription = {
      plan: planName,
      startDate: new Date(),
      expiryDate: expiryDate,
      isActive: true,
    };
    await targetUser.save();

    // Link user to payment record if unlinked
    if (!paymentRecord.user) {
      paymentRecord.user = targetUser._id;
      await paymentRecord.save();
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        subscription: {
          plan: planName,
          startDate: new Date(),
          expiryDate: expiryDate,
          isActive: true,
        },
        user: targetUser ? { name: targetUser.name, email: targetUser.email } : null,
      },
      'Payment verified successfully! Your pass has been unlocked.'
    )
  );
});

/**
 * 3. Get User Current Pass & Subscription Status
 */
export const getUserPassStatus = asyncHandler(async (req, res) => {
  const email = (req.query.email || req.user?.email || '').toLowerCase().trim();
  const userId = req.query.userId || req.user?._id;

  let user = null;
  if (userId) user = await User.findById(userId).lean();
  else if (email) user = await User.findOne({ email }).lean();

  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {
        hasPass: false,
        isAdmin: false,
        subscription: null,
      })
    );
  }

  const role = (user.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const sub = user.subscription || {};
  const isSubActive = Boolean(
    sub.isActive &&
    sub.plan &&
    sub.plan.toLowerCase() !== 'free' &&
    (!sub.expiryDate || new Date(sub.expiryDate) > new Date())
  );

  return res.status(200).json(
    new ApiResponse(200, {
      hasPass: isAdmin || isSubActive,
      isAdmin,
      isSubActive,
      subscription: sub,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  );
});

/**
 * 4. Admin - Get All Payment Transactions
 */
export const getAllPaymentsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find({})
      .populate('user', 'name email phone')
      .populate('series', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({}),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payments,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
      'Payments retrieved successfully'
    )
  );
});
