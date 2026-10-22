import whatsappPool from '../services/whatsappPool.service.js';
import WhatsappSession from '../models/whatsappSession.model.js';
import OtpLog from '../models/otpLog.model.js';

/**
 * Get WhatsApp Connection Pool Status & Worker List
 */
export const getPoolStatus = async (req, res, next) => {
  try {
    const status = await whatsappPool.getPoolStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new worker session in the pool
 */
export const createSession = async (req, res, next) => {
  try {
    const { name, isDefault } = req.body;
    const cleanName = (name || '').trim() || 'Worker Session';
    const sessionId = `worker_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const sessionDoc = await WhatsappSession.create({
      sessionId,
      name: cleanName,
      isDefault: Boolean(isDefault),
      status: 'DISCONNECTED',
    });

    // Auto-initiate worker to generate QR code immediately
    whatsappPool.initWorker(sessionId, cleanName).catch((err) => {
      console.error(`[WhatsApp] Failed to auto-initiate new worker ${sessionId}:`, err.message);
    });

    res.status(201).json({
      success: true,
      message: 'New WhatsApp worker session created in pool!',
      data: sessionDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize or reconnect a worker (starts socket & emits QR)
 */
export const initSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { forceFresh } = req.body || {};
    let session = await WhatsappSession.findOne({ sessionId });
    if (!session) {
      if (sessionId === 'primary') {
        session = await WhatsappSession.create({
          sessionId: 'primary',
          name: 'Primary OTP Dispatcher',
          isDefault: true,
          status: 'DISCONNECTED',
        });
      } else {
        return res.status(404).json({ success: false, message: 'WhatsApp session not found' });
      }
    }

    const worker = await whatsappPool.initWorker(sessionId, session.name, Boolean(forceFresh));

    // Wait briefly up to 2 seconds for QR code generation if reloading
    if (!worker.qrCode && worker.status !== 'CONNECTED') {
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const current = whatsappPool.pool.get(sessionId);
        if (current?.qrCode || current?.status === 'CONNECTED') {
          break;
        }
      }
    }
    const current = whatsappPool.pool.get(sessionId) || worker;

    res.status(200).json({
      success: true,
      message: 'Worker initialized. QR code ready for scanning.',
      data: {
        sessionId: current.sessionId,
        status: current.status,
        qrCode: current.qrCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest live QR code for a session
 */
export const getSessionQR = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await WhatsappSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'WhatsApp session not found' });
    }

    const live = whatsappPool.pool.get(sessionId);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        status: live?.status || session.status,
        qrCode: live?.qrCode || session.qrCode || '',
        phone: live?.phone || session.phone || '',
        name: session.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect a worker permanently from device & remove session folder
 */
export const disconnectSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { purge = true } = req.body || {};
    await whatsappPool.disconnectWorker(sessionId, Boolean(purge));

    res.status(200).json({
      success: true,
      message: `Session [${sessionId}] permanently disconnected, device unlinked, and auth files purged.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session and its saved credentials
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await whatsappPool.deleteSession(sessionId);

    res.status(200).json({
      success: true,
      message: `Session [${sessionId}] deleted completely.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send Test OTP via Connection Pool
 */
export const sendTestOTP = async (req, res, next) => {
  try {
    const { phone, sessionId } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Recipient phone number is required' });
    }

    const result = await whatsappPool.sendOTP({
      phone,
      sessionId: sessionId || null,
      minutes: 10,
      metadata: { initiatedBy: req.user?.email || 'admin_diagnostic' },
    });

    res.status(200).json({
      success: true,
      message: `Test OTP successfully dispatched to ${phone}!`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to dispatch WhatsApp OTP',
      code: error.code || 'SEND_ERROR',
    });
  }
};

/**
 * Send generic WhatsApp message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { phone, message, sessionId } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone number and message are required' });
    }

    const result = await whatsappPool.sendMessage({
      phone,
      message,
      sessionId: sessionId || null,
      metadata: { initiatedBy: req.user?.email || 'admin' },
    });

    res.status(200).json({
      success: true,
      message: `Message sent to ${phone}!`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp message',
    });
  }
};

/**
 * Verify submitted OTP
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await whatsappPool.verifyOTP({ phone, otp });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get OTP & Dispatch logs with filtering and pagination
 */
export const getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const channel = req.query.channel;
    const status = req.query.status;
    const search = (req.query.search || '').trim();

    const query = {};
    if (channel && channel !== 'ALL') query.channel = channel;
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { otp: { $regex: search, $options: 'i' } },
        { messageText: { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      OtpLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OtpLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
