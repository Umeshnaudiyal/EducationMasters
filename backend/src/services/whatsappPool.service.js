import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import WhatsappSession from '../models/whatsappSession.model.js';
import Setting from '../models/setting.model.js';
import OtpLog from '../models/otpLog.model.js';

// Safe base directory for WhatsApp credentials (uses os.tmpdir() on serverless like Vercel/Lambda)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const getAuthBaseDir = () => {
  return isServerless
    ? path.join(os.tmpdir(), '.whatsapp_auth')
    : path.join(process.cwd(), '.whatsapp_auth');
};

const getSessionAuthDir = (sessionId) => {
  const base = getAuthBaseDir();
  const dir = path.join(base, sessionId);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // Ignore read-only filesystem warnings
  }
  return dir;
};

class WhatsappPoolService {
  constructor() {
    /**
     * Active Worker Pool
     * Map<sessionId, {
     *   sessionId: string,
     *   name: string,
     *   socket: WASocket,
     *   status: 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED',
     *   qrCode: string (data URL),
     *   phone: string,
     *   messagesSent: number,
     *   activeCount: number,
     *   reconnectTimer: any
     * }>
     */
    this.pool = new Map();
    this.initialized = false;
    this.roundRobinIndex = 0;
    this._baileys = null;
  }

  /**
   * Lazily load Baileys and dependencies only when a worker is actively initialized
   */
  async getBaileys() {
    if (this._baileys) return this._baileys;
    try {
      const baileys = await import('@whiskeysockets/baileys');
      const qrcode = await import('qrcode');
      const pinoLib = await import('pino');

      const makeWASocket = baileys.default || baileys.makeWASocket;
      const QRCode = qrcode.default || qrcode;
      const pino = pinoLib.default || pinoLib;

      this._baileys = {
        makeWASocket,
        DisconnectReason: baileys.DisconnectReason,
        useMultiFileAuthState: baileys.useMultiFileAuthState,
        fetchLatestBaileysVersion: baileys.fetchLatestBaileysVersion,
        QRCode,
        pino,
      };
      return this._baileys;
    } catch (err) {
      console.warn('[WhatsApp Pool] Baileys/QRCode module could not be loaded in this environment:', err.message);
      return {};
    }
  }

  /**
   * Initialize pool on server boot
   */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Persistent WebSocket WhatsApp connections cannot run in serverless functions (Vercel, AWS Lambda)
    if (isServerless) {
      console.log('[WhatsApp Pool] Running in serverless mode; background socket pool auto-start disabled.');
      return;
    }

    try {
      // Find all configured sessions from database
      let sessions = await WhatsappSession.find().sort({ isDefault: -1, createdAt: 1 });

      // Create primary default session if none exists
      if (sessions.length === 0) {
        const defaultSession = await WhatsappSession.create({
          sessionId: 'primary',
          name: 'Primary OTP Dispatcher',
          isDefault: true,
          status: 'DISCONNECTED',
        });
        sessions = [defaultSession];
      }

      console.log(`[WhatsApp Pool] Initializing pool with ${sessions.length} session worker(s)...`);

      // Resume all sessions that have existing credentials
      for (const sessionDoc of sessions) {
        const sessionAuthDir = getSessionAuthDir(sessionDoc.sessionId);
        let hasExistingAuth = false;
        try {
          hasExistingAuth = fs.existsSync(sessionAuthDir) && fs.readdirSync(sessionAuthDir).length > 0;
        } catch (e) {
          hasExistingAuth = false;
        }

        if (hasExistingAuth || sessionDoc.autoReconnect) {
          this.initWorker(sessionDoc.sessionId, sessionDoc.name).catch((err) => {
            console.error(`[WhatsApp Pool] Failed to auto-resume worker ${sessionDoc.sessionId}:`, err.message);
          });
        } else {
          this.pool.set(sessionDoc.sessionId, {
            sessionId: sessionDoc.sessionId,
            name: sessionDoc.name,
            socket: null,
            status: 'DISCONNECTED',
            qrCode: '',
            phone: sessionDoc.phone || '',
            messagesSent: sessionDoc.messagesSent || 0,
            activeCount: 0,
          });
        }
      }
    } catch (err) {
      console.error('[WhatsApp Pool] Initialization error:', err);
    }
  }

  /**
   * Initialize or reconnect a worker in the pool
   */
  async initWorker(sessionId, name = '', forceFresh = false) {
    if (!sessionId) sessionId = 'primary';
    const sessionAuthDir = getSessionAuthDir(sessionId);

    // If forceFresh is requested, purge existing auth files completely so a brand-new QR code is guaranteed
    if (forceFresh && fs.existsSync(sessionAuthDir)) {
      try {
        fs.rmSync(sessionAuthDir, { recursive: true, force: true });
        console.log(`[WhatsApp Pool] [${sessionId}] Auth directory purged for fresh QR reload.`);
      } catch (e) {
        console.warn(`[WhatsApp Pool] [${sessionId}] Failed to purge auth dir:`, e.message);
      }
    }

    try {
      if (!fs.existsSync(sessionAuthDir)) {
        fs.mkdirSync(sessionAuthDir, { recursive: true });
      }
    } catch (e) {
      // ignore
    }

    // In serverless environments, persistent sockets cannot run
    if (isServerless) {
      console.warn(`[WhatsApp Pool] Cannot init worker ${sessionId}: persistent sockets not supported on serverless functions.`);
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'DISCONNECTED', lastError: 'WhatsApp automation is unavailable in serverless environment. Use dedicated server.' }
      );
      return;
    }

    // Clear existing worker socket if any
    const existing = this.pool.get(sessionId);
    if (existing?.reconnectTimer) {
      clearTimeout(existing.reconnectTimer);
      existing.reconnectTimer = null;
    }
    if (existing?.socket) {
      try {
        existing.socket.ev.removeAllListeners();
        existing.socket.end();
      } catch (e) {
        // ignore
      }
    }

    const workerState = {
      sessionId,
      name: name || existing?.name || `Worker ${sessionId}`,
      socket: null,
      status: 'CONNECTING',
      qrCode: '',
      phone: forceFresh ? '' : existing?.phone || '',
      messagesSent: existing?.messagesSent || 0,
      activeCount: 0,
      reconnectTimer: null,
    };
    this.pool.set(sessionId, workerState);

    await WhatsappSession.findOneAndUpdate(
      { sessionId },
      {
        status: 'CONNECTING',
        lastError: '',
        ...(forceFresh ? { qrCode: '', phone: '', 'metadata.pushName': '' } : {}),
      },
      { upsert: true }
    );

    const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, QRCode, pino } = await this.getBaileys();
    if (!makeWASocket) {
      console.warn(`[WhatsApp Pool] Baileys library not available in this environment.`);
      workerState.status = 'DISCONNECTED';
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'DISCONNECTED', lastError: 'Baileys library unavailable in this environment' }
      );
      return;
    }

    const silentLogger = pino ? pino({ level: 'silent' }) : undefined;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        logger: silentLogger,
        printQRInTerminal: false,
        browser: ['Education Masters CRM', 'Chrome', '124.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      workerState.socket = sock;

      // Credential updates
      sock.ev.on('creds.update', saveCreds);

      // Connection updates
      sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qr, {
        margin: 2,
        scale: 7,
        color: { dark: '#111827', light: '#FFFFFF' },
      });
      workerState.status = 'SCAN_QR';
      workerState.qrCode = qrDataUrl;

      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'SCAN_QR', qrCode: qrDataUrl }
      );

      // Update global settings status
      await this.updateGlobalStatus();
      console.log(`[WhatsApp Pool] [${sessionId}] New QR code generated. Ready for scanning.`);
    } catch (qrErr) {
      console.error(`[WhatsApp Pool] QR generation error:`, qrErr);
    }
  }

  if (connection === 'open') {
    workerState.status = 'CONNECTED';
    workerState.qrCode = '';

    // Format clean phone number from JID
    let cleanPhone = '';
    if (sock.user?.id) {
      const raw = (sock.user.id.split(':')[0] || sock.user.id.split('@')[0] || '').replace(/^\++/, '');
      cleanPhone = raw ? `+${raw}` : '';
    }
    workerState.phone = cleanPhone;

    await WhatsappSession.findOneAndUpdate(
      { sessionId },
      {
        status: 'CONNECTED',
        phone: cleanPhone,
        qrCode: '',
        lastConnectedAt: new Date(),
        lastError: '',
        'metadata.pushName': sock.user?.name || '',
      }
    );

    await this.updateGlobalStatus();
    console.log(`[WhatsApp Pool] [${sessionId}] Connected successfully! Active Phone: ${cleanPhone}`);
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;

    workerState.status = 'DISCONNECTED';
    workerState.qrCode = '';

    console.log(
      `[WhatsApp Pool] [${sessionId}] Connection closed (status: ${statusCode || 'unknown'}, loggedOut: ${isLoggedOut})`
    );

    if (isLoggedOut) {
      // Remove credentials directory
      try {
        fs.rmSync(sessionAuthDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        { status: 'DISCONNECTED', qrCode: '', lastError: 'Session logged out from device' }
      );
    } else {
      await WhatsappSession.findOneAndUpdate(
        { sessionId },
        {
          status: 'DISCONNECTED',
          lastError: lastDisconnect?.error?.message || 'Connection lost, waiting to reconnect',
        }
      );

      // Auto-reconnect worker after 6 seconds
      if (!workerState.reconnectTimer) {
        workerState.reconnectTimer = setTimeout(() => {
          workerState.reconnectTimer = null;
          console.log(`[WhatsApp Pool] [${sessionId}] Attempting auto-reconnect...`);
          this.initWorker(sessionId, workerState.name).catch(() => { });
        }, 6000);
      }
    }

    await this.updateGlobalStatus();
  }
});

return workerState;
    } catch (error) {
  workerState.status = 'DISCONNECTED';
  await WhatsappSession.findOneAndUpdate(
    { sessionId },
    { status: 'DISCONNECTED', lastError: error.message }
  );
  await this.updateGlobalStatus();
  throw error;
}
  }

  /**
   * Disconnect a worker and permanently remove device link + credentials folder
   */
  async disconnectWorker(sessionId, purge = true) {
  const worker = this.pool.get(sessionId);

  if (worker?.reconnectTimer) {
    clearTimeout(worker.reconnectTimer);
    worker.reconnectTimer = null;
  }

  if (worker?.socket) {
    try {
      if (purge) {
        try {
          await worker.socket.logout();
          console.log(`[WhatsApp Pool] [${sessionId}] Socket successfully logged out from WhatsApp.`);
        } catch (logoutErr) {
          console.warn(`[WhatsApp Pool] [${sessionId}] Socket logout warning:`, logoutErr.message);
        }
      }
      worker.socket.ev.removeAllListeners();
      worker.socket.end();
    } catch (e) {
      // ignore
    }
    worker.socket = null;
  }

  if (worker) {
    worker.status = 'DISCONNECTED';
    worker.qrCode = '';
    if (purge) {
      worker.phone = '';
    }
  }

  if (purge) {
    const sessionAuthDir = getSessionAuthDir(sessionId);
    if (fs.existsSync(sessionAuthDir)) {
      try {
        fs.rmSync(sessionAuthDir, { recursive: true, force: true });
        console.log(`[WhatsApp Pool] [${sessionId}] Auth directory purged permanently from disk.`);
      } catch (e) {
        console.warn(`[WhatsApp Pool] [${sessionId}] Error removing auth folder:`, e.message);
      }
    }
  }

  await WhatsappSession.findOneAndUpdate(
    { sessionId },
    {
      status: 'DISCONNECTED',
      qrCode: '',
      ...(purge ? { phone: '', 'metadata.pushName': '', lastError: '' } : {}),
    }
  );

  await this.updateGlobalStatus();
  return true;
}

  /**
   * Delete a session completely (credentials + DB record)
   */
  async deleteSession(sessionId) {
  await this.disconnectWorker(sessionId, true);
  this.pool.delete(sessionId);
  await WhatsappSession.deleteOne({ sessionId });
  await this.updateGlobalStatus();
  return true;
}

/**
 * Select a connected worker from the pool
 * Load balancing: Round-Robin / Least Busy
 */
getAvailableWorker(preferredSessionId = null) {
  if (preferredSessionId) {
    const preferred = this.pool.get(preferredSessionId);
    if (preferred && preferred.status === 'CONNECTED' && preferred.socket) {
      return preferred;
    }
  }

  const connectedWorkers = Array.from(this.pool.values()).filter(
    (w) => w.status === 'CONNECTED' && w.socket
  );

  if (connectedWorkers.length === 0) {
    return null;
  }

  // Pick least busy worker (lowest active concurrent operations)
  connectedWorkers.sort((a, b) => a.activeCount - b.activeCount);
  const worker = connectedWorkers[0];
  return worker;
}

/**
 * Normalize recipient phone number for WhatsApp JID
 * Standardizes Indian 10-digit numbers to 91XXXXXXXXXX@s.whatsapp.net
 */
formatRecipientJid(rawPhone, defaultCountryCode = '91') {
  if (!rawPhone) throw new Error('Phone number is required');

  // Remove all non-digit characters
  let digits = String(rawPhone).replace(/\D/g, '');

  // If starts with 0, remove leading 0
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // If 10 digits (common Indian mobile), prepend default country code
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }

  return `${digits}@s.whatsapp.net`;
}

/**
 * Generate 6-digit secure numeric OTP
 */
generateSecureOtp(length = 6) {
  return crypto.randomInt(100000, 999999).toString();
}

  /**
   * Send WhatsApp OTP using the Connection Pool
   */
  async sendOTP({ phone, sessionId = null, minutes = 10, metadata = {} }) {
  const worker = this.getAvailableWorker(sessionId);
  if (!worker) {
    const err = new Error(
      'No connected WhatsApp worker available in the pool. Please scan QR in Admin WhatsApp Integration.'
    );
    err.code = 'NO_WHATSAPP_WORKER';
    throw err;
  }

  const settings = await Setting.getGlobal();
  const otpCode = this.generateSecureOtp(6);
  const jid = this.formatRecipientJid(phone, settings.whatsapp?.defaultCountryCode || '91');

  // Format OTP message template
  const rawTemplate =
    settings.whatsapp?.otpTemplate ||
    '🔐 *Education Masters Verification Code*\n\nYour OTP is *{{OTP}}*. Valid for {{MINUTES}} minutes.\nDo not share this code with anyone.';

  const messageText = rawTemplate
    .replace(/{{OTP}}/g, otpCode)
    .replace(/{{MINUTES}}/g, String(minutes))
    .replace(/{{PHONE}}/g, phone);

  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Track active concurrency on worker
  worker.activeCount++;
  try {
    const sentResult = await worker.socket.sendMessage(jid, {
      text: messageText,
    });

    // Increment worker counter
    worker.messagesSent++;
    await WhatsappSession.updateOne(
      { sessionId: worker.sessionId },
      { $inc: { messagesSent: 1 }, $set: { lastActiveAt: new Date() } }
    );

    // Create OTP log entry in MongoDB
    const logDoc = await OtpLog.create({
      recipient: jid.replace('@s.whatsapp.net', ''),
      otp: otpCode,
      type: 'OTP',
      channel: 'WHATSAPP',
      sessionId: worker.sessionId,
      status: 'DELIVERED',
      messageText,
      expiresAt,
      metadata: {
        ...metadata,
        messageId: sentResult?.key?.id,
        workerName: worker.name,
      },
    });

    return {
      success: true,
      messageId: sentResult?.key?.id,
      workerUsed: { sessionId: worker.sessionId, name: worker.name },
      otpLogId: logDoc._id,
      otp: otpCode,
      expiresAt,
    };
  } catch (sendError) {
    await OtpLog.create({
      recipient: jid.replace('@s.whatsapp.net', ''),
      otp: otpCode,
      type: 'OTP',
      channel: 'WHATSAPP',
      sessionId: worker.sessionId,
      status: 'FAILED',
      messageText,
      expiresAt,
      error: sendError.message,
    });
    throw sendError;
  } finally {
    worker.activeCount = Math.max(0, worker.activeCount - 1);
  }
}

  /**
   * Send custom WhatsApp notification message via pool
   */
  async sendMessage({ phone, message, sessionId = null, metadata = {} }) {
  const worker = this.getAvailableWorker(sessionId);
  if (!worker) {
    const err = new Error(
      'No connected WhatsApp worker available in the pool. Please scan QR in Admin WhatsApp Integration.'
    );
    err.code = 'NO_WHATSAPP_WORKER';
    throw err;
  }

  const settings = await Setting.getGlobal();
  const jid = this.formatRecipientJid(phone, settings.whatsapp?.defaultCountryCode || '91');

  worker.activeCount++;
  try {
    const result = await worker.socket.sendMessage(jid, { text: message });

    worker.messagesSent++;
    await WhatsappSession.updateOne(
      { sessionId: worker.sessionId },
      { $inc: { messagesSent: 1 }, $set: { lastActiveAt: new Date() } }
    );

    await OtpLog.create({
      recipient: jid.replace('@s.whatsapp.net', ''),
      otp: 'N/A',
      type: 'NOTIFICATION',
      channel: 'WHATSAPP',
      sessionId: worker.sessionId,
      status: 'DELIVERED',
      messageText: message,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {
        ...metadata,
        messageId: result?.key?.id,
        workerName: worker.name,
      },
    });

    return {
      success: true,
      messageId: result?.key?.id,
      workerUsed: { sessionId: worker.sessionId, name: worker.name },
    };
  } finally {
    worker.activeCount = Math.max(0, worker.activeCount - 1);
  }
}

  /**
   * Verify an OTP submitted by user
   */
  async verifyOTP({ phone, otp, defaultCountryCode = '91' }) {
  if (!phone || !otp) {
    return { success: false, message: 'Phone number and OTP code are required' };
  }

  const cleanDigits = String(phone).replace(/\D/g, '');
  const standardPhone = cleanDigits.length === 10 ? `${defaultCountryCode}${cleanDigits}` : cleanDigits;

  const latestLog = await OtpLog.findOne({
    recipient: standardPhone,
    channel: 'WHATSAPP',
    type: 'OTP',
    status: { $in: ['PENDING', 'SENT', 'DELIVERED'] },
  }).sort({ createdAt: -1 });

  if (!latestLog) {
    return { success: false, message: 'No active OTP verification found for this number. Please request a new OTP.' };
  }

  if (new Date() > latestLog.expiresAt) {
    latestLog.status = 'EXPIRED';
    await latestLog.save();
    return { success: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  latestLog.attempts = (latestLog.attempts || 0) + 1;

  if (latestLog.attempts > (latestLog.maxAttempts || 5)) {
    latestLog.status = 'FAILED';
    latestLog.error = 'Maximum verification attempts exceeded';
    await latestLog.save();
    return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  if (latestLog.otp.trim() !== String(otp).trim()) {
    await latestLog.save();
    return {
      success: false,
      message: 'Invalid OTP code. Please enter the correct verification code.',
      attemptsRemaining: Math.max(0, (latestLog.maxAttempts || 5) - latestLog.attempts),
    };
  }

  latestLog.status = 'VERIFIED';
  latestLog.verifiedAt = new Date();
  await latestLog.save();

  return {
    success: true,
    message: 'OTP verified successfully!',
    verifiedAt: latestLog.verifiedAt,
  };
}

  /**
   * Sync overall pool status to the Setting model
   */
  async updateGlobalStatus() {
  try {
    const workers = Array.from(this.pool.values());
    const hasConnected = workers.some((w) => w.status === 'CONNECTED');
    const hasQr = workers.some((w) => w.status === 'SCAN_QR');

    let globalStatus = 'DISCONNECTED';
    if (hasConnected) globalStatus = 'CONNECTED';
    else if (hasQr) globalStatus = 'SCAN_QR';

    await Setting.findOneAndUpdate(
      { key: 'global_settings' },
      {
        $set: {
          'whatsapp.status': globalStatus,
          'whatsapp.lastActiveAt': new Date(),
        },
      },
      { upsert: true }
    );
  } catch (e) {
    // ignore
  }
}

  /**
   * Get complete Pool Status for Admin UI
   */
  async getPoolStatus() {
  const dbSessions = await WhatsappSession.find().sort({ isDefault: -1, createdAt: 1 }).lean();

  const sessionsWithLiveStatus = dbSessions.map((session) => {
    const live = this.pool.get(session.sessionId);
    return {
      ...session,
      status: live?.status || session.status || 'DISCONNECTED',
      qrCode: live?.qrCode || session.qrCode || '',
      phone: live?.phone || session.phone || '',
      messagesSent: live?.messagesSent ?? session.messagesSent ?? 0,
      activeCount: live?.activeCount || 0,
    };
  });

  const connectedCount = sessionsWithLiveStatus.filter((s) => s.status === 'CONNECTED').length;
  const qrCount = sessionsWithLiveStatus.filter((s) => s.status === 'SCAN_QR').length;

  let overallStatus = 'DISCONNECTED';
  if (connectedCount > 0) overallStatus = 'CONNECTED';
  else if (qrCount > 0) overallStatus = 'SCAN_QR';

  return {
    overallStatus,
    totalWorkers: sessionsWithLiveStatus.length,
    connectedWorkers: connectedCount,
    qrPendingWorkers: qrCount,
    sessions: sessionsWithLiveStatus,
  };
}
}

// Singleton pool instance
const whatsappPool = new WhatsappPoolService();
export default whatsappPool;
