import Subscriber from '../models/subscriber.model.js';

/**
 * Public endpoint: Subscribe to Newsletter / Exam Alerts
 */
export const subscribeNewsletter = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, interest } = req.body;

    const rawPhone = (whatsapp || phone || '').toString().trim();
    const cleanPhone = rawPhone.replace(/\D/g, ''); // Extract only digits
    const cleanName = (name || '').toString().trim();
    const cleanEmail = (email || '').toString().trim().toLowerCase();

    // 1. Name validation
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Name is required.',
      });
    }

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Name must be at least 2 characters.',
      });
    }

    // 2. WhatsApp / Mobile Number validation (Must be exactly 10 digits)
    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        field: 'whatsapp',
        message: 'WhatsApp mobile number is required.',
      });
    }

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        field: 'whatsapp',
        message: 'Mobile number must be exactly 10 digits.',
      });
    }

    // 3. Email validation
    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Email address is required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please enter a valid email address.',
      });
    }

    // 4. Uniqueness validations
    // Check if email is already registered
    const existingEmail = await Subscriber.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        field: 'email',
        message: 'This email is already subscribed to updates.',
      });
    }

    // Check if mobile number is already registered
    const existingPhone = await Subscriber.findOne({
      $or: [{ phone: cleanPhone }, { phone: rawPhone }],
    });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        field: 'whatsapp',
        message: 'This mobile number is already registered for updates.',
      });
    }

    // 5. Create new Subscriber
    const newSubscriber = await Subscriber.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      interest: interest || 'All Updates (GK, Jobs, Exams, Study Material)',
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed to updates!',
      data: newSubscriber,
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to subscribe. Please try again.',
    });
  }
};

/**
 * Admin: Get paginated list of subscribers with search & filters
 */
export const getSubscribers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    const activeQuery = {
      $or: [
        { active: true },
        { active: 1 },
        { active: '1' },
        { active: { $exists: false } },
        { status: 1 },
        { status: 'active' },
        { status: true },
      ],
    };

    const inactiveQuery = {
      $or: [
        { active: false },
        { active: 0 },
        { active: '0' },
        { status: 0 },
        { status: 'inactive' },
        { status: false },
      ],
    };

    // Filter by Active/Inactive status
    if (status === 'active') {
      Object.assign(query, activeQuery);
    } else if (status === 'inactive') {
      Object.assign(query, inactiveQuery);
    }

    // Search by Name, Email, Phone, Interest
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { interest: searchRegex },
      ];
    }

    const [subscribers, total, grandTotal, totalActive, totalInactive] = await Promise.all([
      Subscriber.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscriber.countDocuments(query),
      Subscriber.countDocuments({}),
      Subscriber.countDocuments(activeQuery),
      Subscriber.countDocuments(inactiveQuery),
    ]);

    const formattedSubscribers = subscribers.map((sub) => {
      const isActive =
        sub.active === true ||
        sub.active === 1 ||
        sub.active === '1' ||
        sub.status === 1 ||
        sub.status === 'active' ||
        (sub.active === undefined && sub.status === undefined);

      return {
        ...sub,
        active: isActive,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedSubscribers,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
      stats: {
        total: grandTotal,
        active: totalActive,
        inactive: totalInactive,
      },
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscribers.',
      error: error.message,
    });
  }
};

/**
 * Admin: Get single subscriber by ID
 */
export const getSubscriberById = async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: subscriber,
    });
  } catch (error) {
    console.error('Error fetching subscriber by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriber details.',
      error: error.message,
    });
  }
};

/**
 * Admin: Create a new subscriber manually
 */
export const createSubscriber = async (req, res) => {
  try {
    const { name, email, phone, interest, active } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either an email or phone number.',
      });
    }

    // Check duplicate
    const filter = {};
    if (email && phone) {
      filter.$or = [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }];
    } else if (email) {
      filter.email = email.trim().toLowerCase();
    } else {
      filter.phone = phone.trim();
    }

    const existing = await Subscriber.findOne(filter);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A subscriber with this email or phone already exists.',
      });
    }

    const newSubscriber = await Subscriber.create({
      name: name ? name.trim() : 'Subscriber',
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      interest: interest ? interest.trim() : 'All Exam Updates',
      active: active !== undefined ? Boolean(active) : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Subscriber added successfully.',
      data: newSubscriber,
    });
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create subscriber.',
      error: error.message,
    });
  }
};

/**
 * Admin: Update subscriber details
 */
export const updateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, interest, active } = req.body;

    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.',
      });
    }

    // Check if updating email or phone conflicts with another subscriber
    if (email || phone) {
      const conflictFilter = { _id: { $ne: id } };
      const orConditions = [];
      if (email) orConditions.push({ email: email.trim().toLowerCase() });
      if (phone) orConditions.push({ phone: phone.trim() });
      conflictFilter.$or = orConditions;

      const conflict = await Subscriber.findOne(conflictFilter);
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Another subscriber already uses this email or phone number.',
        });
      }
    }

    if (name !== undefined) subscriber.name = name.trim();
    if (email !== undefined) subscriber.email = email ? email.trim().toLowerCase() : undefined;
    if (phone !== undefined) subscriber.phone = phone ? phone.trim() : undefined;
    if (interest !== undefined) subscriber.interest = interest.trim();
    if (active !== undefined) subscriber.active = Boolean(active);

    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: 'Subscriber updated successfully.',
      data: subscriber,
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subscriber.',
      error: error.message,
    });
  }
};

/**
 * Admin: Delete a subscriber
 */
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subscriber.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscriber removed successfully.',
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete subscriber.',
      error: error.message,
    });
  }
};

/**
 * Admin: Bulk actions (delete, activate, deactivate)
 */
export const bulkActionSubscribers = async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one subscriber.',
      });
    }

    if (action === 'delete') {
      const result = await Subscriber.deleteMany({ _id: { $in: ids } });
      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} subscriber(s).`,
      });
    }

    if (action === 'activate') {
      const result = await Subscriber.updateMany(
        { _id: { $in: ids } },
        { $set: { active: true } }
      );
      return res.status(200).json({
        success: true,
        message: `Activated ${result.modifiedCount} subscriber(s).`,
      });
    }

    if (action === 'deactivate') {
      const result = await Subscriber.updateMany(
        { _id: { $in: ids } },
        { $set: { active: false } }
      );
      return res.status(200).json({
        success: true,
        message: `Deactivated ${result.modifiedCount} subscriber(s).`,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid bulk action specified.',
    });
  } catch (error) {
    console.error('Error in bulkActionSubscribers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action.',
      error: error.message,
    });
  }
};
