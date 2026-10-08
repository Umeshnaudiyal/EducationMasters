import { StickyNote } from '../models/index.js';
import ApiError from '../utils/apiError.js';

/**
 * Get all sticky notes (with search, category, type, and pagination filters)
 */
export const getStickyNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = req.query.status || 'active'; // 'active', 'archived', 'all'
    const type = req.query.type;
    const color = req.query.color;
    const isAll = req.query.all === 'true';

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (color && color !== 'all') {
      query.color = color;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Auto-seed initial verified sticky notes if empty
    const totalExisting = await StickyNote.countDocuments();
    if (totalExisting === 0) {
      await StickyNote.insertMany([
        {
          title: 'Official Exam Instructions 2026',
          content: 'Candidates must carry their printed Admit Card along with an original Govt Photo ID proof (Aadhar / PAN / Voter ID). Electronic gadgets & calculators are strictly prohibited inside the exam hall.',
          color: 'yellow',
          type: 'exam-rule',
          status: 'active',
          priority: 'urgent',
          isPinned: true,
          audience: 'All Candidates',
          linkLabel: 'View Rules PDF',
          linkUrl: '/admit-cards',
          authorName: 'Official Exam Controller',
        },
        {
          title: 'Railway NTPC CBT-2 Advisory',
          content: 'The Railway Recruitment Board has released the city intimation slip 10 days prior to the examination date. Please ensure your biometrics match your application details.',
          color: 'purple',
          type: 'advisory',
          status: 'active',
          priority: 'high',
          isPinned: false,
          audience: 'Railway Aspirants',
          linkLabel: 'Check City Slip',
          linkUrl: '/jobs',
          authorName: 'RRB Board',
        },
        {
          title: 'Admit Card Verification Notice',
          content: 'In case of any discrepancy in your photograph, signature, or name spelling on the downloaded admit card, immediately raise a grievance ticket through the official helpdesk portal before the final closing date.',
          color: 'blue',
          type: 'notice',
          status: 'active',
          priority: 'normal',
          isPinned: false,
          audience: 'General Public',
          linkLabel: 'Helpdesk Portal',
          linkUrl: '/admit-cards',
          authorName: 'Verification Desk',
        },
        {
          title: 'Mock Test Series Updates',
          content: 'New Sectional Practice Tests and Previous Year Question (PYQ) solution sets with detailed analytical scorecards have been updated in the test series hub.',
          color: 'green',
          type: 'announcement',
          status: 'active',
          priority: 'normal',
          isPinned: false,
          audience: 'Students',
          linkLabel: 'Take Free Mock Test',
          linkUrl: '/mock-tests',
          authorName: 'Academic Team',
        },
      ]);
    }

    const sortOptions = { isPinned: -1, createdAt: -1 };

    if (isAll) {
      const notes = await StickyNote.find(query).sort(sortOptions).lean();
      return res.status(200).json({
        success: true,
        count: notes.length,
        total: notes.length,
        data: notes,
      });
    }

    const [notes, total, activeCount, archivedCount] = await Promise.all([
      StickyNote.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      StickyNote.countDocuments(query),
      StickyNote.countDocuments({ status: 'active' }),
      StickyNote.countDocuments({ status: 'archived' }),
    ]);

    res.status(200).json({
      success: true,
      count: notes.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      stats: {
        active: activeCount,
        archived: archivedCount,
      },
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single sticky note by ID
 */
export const getStickyNoteById = async (req, res, next) => {
  try {
    const note = await StickyNote.findById(req.params.id);
    if (!note) {
      throw new ApiError(404, 'Sticky note not found');
    }
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new sticky note (Admin)
 */
export const createStickyNote = async (req, res, next) => {
  try {
    const { title, content, color, type, status, priority, isPinned, audience, linkUrl, linkLabel, tags } = req.body;

    if (!title || !title.trim()) {
      throw new ApiError(400, 'Sticky note title is required.');
    }
    if (!content || !content.trim()) {
      throw new ApiError(400, 'Sticky note content is required.');
    }

    const authorName = req.user?.name || 'Education Masters Admin';
    const authorId = req.user?._id;

    const newNote = await StickyNote.create({
      title: title.trim(),
      content: content.trim(),
      color: color || 'yellow',
      type: type || 'notice',
      status: status || 'active',
      priority: priority || 'normal',
      isPinned: Boolean(isPinned),
      audience: audience || 'all',
      linkUrl: (linkUrl || '').trim(),
      linkLabel: (linkLabel || '').trim(),
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      author: authorId,
      authorName,
    });

    res.status(201).json({
      success: true,
      message: 'Sticky note created successfully',
      data: newNote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing sticky note (Admin)
 */
export const updateStickyNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const note = await StickyNote.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      throw new ApiError(404, 'Sticky note not found');
    }

    res.status(200).json({
      success: true,
      message: 'Sticky note updated successfully',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sticky note (Admin)
 */
export const deleteStickyNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await StickyNote.findByIdAndDelete(id);

    if (!note) {
      throw new ApiError(404, 'Sticky note not found');
    }

    res.status(200).json({
      success: true,
      message: 'Sticky note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle archive status (Admin)
 */
export const toggleArchiveStickyNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await StickyNote.findById(id);

    if (!note) {
      throw new ApiError(404, 'Sticky note not found');
    }

    note.status = note.status === 'archived' ? 'active' : 'archived';
    await note.save();

    res.status(200).json({
      success: true,
      message: `Sticky note marked as ${note.status}`,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Increment view count (Public)
 */
export const incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await StickyNote.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!note) {
      throw new ApiError(404, 'Sticky note not found');
    }

    res.status(200).json({
      success: true,
      viewCount: note.viewCount,
    });
  } catch (error) {
    next(error);
  }
};
