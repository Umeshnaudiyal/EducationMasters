import Setting from '../models/setting.model.js';
import whatsappPool from '../services/whatsappPool.service.js';
import smtpService from '../services/smtp.service.js';

/**
 * Get global portal settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getGlobal();
    const data = settings.toObject();

    const storedUser = (data.smtp?.user || '').trim();
    const storedPass = (data.smtp?.pass || '').trim();
    const hasStoredPass = Boolean(storedPass && storedPass !== '••••••••');
    const hasStoredUser = Boolean(storedUser);
    const hasCredentials = hasStoredPass && hasStoredUser;

    data.smtp.hasPassword = hasStoredPass;
    data.smtp.hasCredentials = hasCredentials;

    // STRICT RULE: If email or password is not stored, status MUST NOT be CONNECTED
    if (!hasCredentials) {
      data.smtp.status = 'UNCONFIGURED';
      data.smtp.isConfigured = false;
    }

    // Mask sensitive SMTP password for security
    if (hasStoredPass) {
      data.smtp.pass = '••••••••';
    } else {
      data.smtp.pass = '';
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update global portal settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getGlobal();
    const body = req.body || {};

    // General fields
    if (body.siteName !== undefined) settings.siteName = body.siteName;
    if (body.tagline !== undefined) settings.tagline = body.tagline;
    if (body.adminEmail !== undefined) settings.adminEmail = body.adminEmail;
    if (body.contactPhone !== undefined) settings.contactPhone = body.contactPhone;
    if (body.metaTitle !== undefined) settings.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) settings.metaDescription = body.metaDescription;
    if (body.metaKeywords !== undefined) settings.metaKeywords = body.metaKeywords;
    if (body.allowIndexing !== undefined) settings.allowIndexing = Boolean(body.allowIndexing);

    // SMTP fields
    if (body.smtp) {
      if (body.smtp.host !== undefined) settings.smtp.host = (body.smtp.host || 'smtp.gmail.com').trim();
      if (body.smtp.port !== undefined) settings.smtp.port = Number(body.smtp.port) || 587;
      if (body.smtp.user !== undefined) settings.smtp.user = (body.smtp.user || '').trim();
      if (body.smtp.pass !== undefined && body.smtp.pass !== '••••••••') {
        settings.smtp.pass = (body.smtp.pass || '').trim();
      }
      if (body.smtp.secure !== undefined) settings.smtp.secure = Boolean(body.smtp.secure);
      if (body.smtp.fromName !== undefined) settings.smtp.fromName = body.smtp.fromName;
      if (body.smtp.fromEmail !== undefined) settings.smtp.fromEmail = body.smtp.fromEmail;

      const hasStoredUser = Boolean(settings.smtp.user && settings.smtp.user.trim() !== '');
      const hasStoredPass = Boolean(settings.smtp.pass && settings.smtp.pass.trim() !== '');
      const hasCredentials = hasStoredUser && hasStoredPass;

      if (!hasCredentials) {
        settings.smtp.status = 'UNCONFIGURED';
        settings.smtp.isConfigured = false;
        settings.smtp.lastError = 'SMTP email and app password must be stored.';
      } else {
        // Both credentials are provided/stored. Test connection via Nodemailer
        try {
          const verifyResult = await smtpService.verifyConnection({
            host: settings.smtp.host,
            port: settings.smtp.port,
            user: settings.smtp.user,
            pass: settings.smtp.pass,
            secure: settings.smtp.secure,
          });
          if (verifyResult.success) {
            settings.smtp.status = 'CONNECTED';
            settings.smtp.isConfigured = true;
            settings.smtp.lastTestedAt = new Date();
            settings.smtp.lastError = '';
          } else {
            settings.smtp.status = 'ERROR';
            settings.smtp.isConfigured = false;
            settings.smtp.lastTestedAt = new Date();
            settings.smtp.lastError = verifyResult.message || 'SMTP Authentication failed';
          }
        } catch (err) {
          settings.smtp.status = 'ERROR';
          settings.smtp.isConfigured = false;
          settings.smtp.lastTestedAt = new Date();
          settings.smtp.lastError = err.message || 'SMTP Handshake error';
        }
      }
    }

    // WhatsApp fields
    if (body.whatsapp) {
      if (body.whatsapp.defaultSessionId !== undefined) {
        settings.whatsapp.defaultSessionId = body.whatsapp.defaultSessionId;
      }
      if (body.whatsapp.maxWorkers !== undefined) {
        settings.whatsapp.maxWorkers = Number(body.whatsapp.maxWorkers) || 3;
      }
      if (body.whatsapp.otpExpiryMinutes !== undefined) {
        settings.whatsapp.otpExpiryMinutes = Number(body.whatsapp.otpExpiryMinutes) || 10;
      }
      if (body.whatsapp.otpTemplate !== undefined) {
        settings.whatsapp.otpTemplate = body.whatsapp.otpTemplate;
      }
      if (body.whatsapp.autoReconnect !== undefined) {
        settings.whatsapp.autoReconnect = Boolean(body.whatsapp.autoReconnect);
      }
      if (body.whatsapp.isEnabled !== undefined) {
        settings.whatsapp.isEnabled = Boolean(body.whatsapp.isEnabled);
      }
      if (body.whatsapp.defaultCountryCode !== undefined) {
        settings.whatsapp.defaultCountryCode = String(body.whatsapp.defaultCountryCode).replace(/\D/g, '') || '91';
      }
    }

    // Auth & Registration Dynamic Settings
    if (body.authSettings) {
      if (!settings.authSettings) {
        settings.authSettings = {};
      }
      if (body.authSettings.allowNewRegistrations !== undefined) {
        settings.authSettings.allowNewRegistrations = Boolean(body.authSettings.allowNewRegistrations);
      }
      if (body.authSettings.registrationClosedMessage !== undefined) {
        settings.authSettings.registrationClosedMessage = String(body.authSettings.registrationClosedMessage).trim();
      }
      if (body.authSettings.googleNewUserPhoneVerification !== undefined) {
        settings.authSettings.googleNewUserPhoneVerification = Boolean(body.authSettings.googleNewUserPhoneVerification);
      }
      if (body.authSettings.existingUserPhoneVerification !== undefined) {
        settings.authSettings.existingUserPhoneVerification = Boolean(body.authSettings.existingUserPhoneVerification);
      }
      if (body.authSettings.manualRegistrationOtpMode !== undefined) {
        const validModes = ['whatsapp', 'email', 'both', 'none'];
        if (validModes.includes(body.authSettings.manualRegistrationOtpMode)) {
          settings.authSettings.manualRegistrationOtpMode = body.authSettings.manualRegistrationOtpMode;
        }
      }
      if (body.authSettings.otpExpiryMinutes !== undefined) {
        settings.authSettings.otpExpiryMinutes = Number(body.authSettings.otpExpiryMinutes) || 10;
      }
      if (body.authSettings.emailOtpSubject !== undefined) {
        settings.authSettings.emailOtpSubject = String(body.authSettings.emailOtpSubject).trim();
      }
    }

    await settings.save();

    // Invalidate cached transporter on SMTP updates
    smtpService.cachedTransporter = null;
    smtpService.cachedConfigHash = null;

    res.status(200).json({
      success: true,
      message: 'Portal settings saved successfully!',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quick live status of WhatsApp and SMTP for Admin Header and quick widgets
 */
export const getGlobalStatus = async (req, res, next) => {
  try {
    const [settings, poolStatus] = await Promise.all([
      Setting.getGlobal(),
      whatsappPool.getPoolStatus(),
    ]);

    const activeWorker = poolStatus.sessions.find((s) => s.status === 'CONNECTED');

    const whatsappInfo = {
      status: poolStatus.overallStatus, // 'CONNECTED' | 'SCAN_QR' | 'DISCONNECTED'
      connectedWorkers: poolStatus.connectedWorkers,
      totalWorkers: poolStatus.totalWorkers,
      activePhone: activeWorker?.phone ? `+${String(activeWorker.phone).trim().replace(/^\++/, '')}` : '',
      activeName: activeWorker?.name || '',
      qrPending: poolStatus.qrPendingWorkers > 0,
    };

    const storedUser = (settings.smtp?.user || '').trim();
    const storedPass = (settings.smtp?.pass || '').trim();
    const hasStoredCredentials = Boolean(storedUser && storedPass);

    // If DB currently has CONNECTED but user or pass is empty, self-heal DB right here
    let effectiveStatus = settings.smtp?.status || 'UNCONFIGURED';
    if (!hasStoredCredentials) {
      effectiveStatus = 'UNCONFIGURED';
      if (settings.smtp?.status === 'CONNECTED' || settings.smtp?.isConfigured) {
        await Setting.findOneAndUpdate(
          { key: 'global_settings' },
          {
            $set: {
              'smtp.status': 'UNCONFIGURED',
              'smtp.isConfigured': false,
              'smtp.lastError': 'SMTP credentials not configured.',
            },
          }
        );
      }
    }

    const smtpInfo = {
      status: effectiveStatus, // STRICT: 'CONNECTED' only when both user and pass are stored and verified
      host: settings.smtp?.host || 'smtp.gmail.com',
      port: settings.smtp?.port || 587,
      user: storedUser,
      fromEmail: settings.smtp?.fromEmail || '',
      isConfigured: Boolean(hasStoredCredentials && settings.smtp?.isConfigured),
      hasCredentials: hasStoredCredentials,
      hasPassword: Boolean(storedPass),
      lastTestedAt: settings.smtp?.lastTestedAt || null,
      lastError: settings.smtp?.lastError || '',
    };

    res.status(200).json({
      success: true,
      data: {
        whatsapp: whatsappInfo,
        smtp: smtpInfo,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
