import nodemailer from 'nodemailer';
import Setting from '../models/setting.model.js';
import OtpLog from '../models/otpLog.model.js';

class SmtpService {
  constructor() {
    this.cachedTransporter = null;
    this.cachedConfigHash = null;
  }

  /**
   * Create or return cached nodemailer transporter using global database settings
   */
  async getTransporter(overrideConfig = null) {
    const settings = await Setting.getGlobal();
    const config = overrideConfig || settings.smtp || {};

    const host = config.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(config.port) || Number(process.env.SMTP_PORT) || 587;
    const user = config.user || process.env.SMTP_USER || '';
    const pass = config.pass || process.env.SMTP_PASS || '';
    const secure = Boolean(config.secure) || port === 465;

    const currentHash = `${host}:${port}:${user}:${pass}:${secure}`;

    if (!overrideConfig && this.cachedTransporter && this.cachedConfigHash === currentHash) {
      return this.cachedTransporter;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: (user && pass) ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues on internal mail servers
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });

    if (!overrideConfig) {
      this.cachedTransporter = transporter;
      this.cachedConfigHash = currentHash;
    }

    return transporter;
  }

  /**
   * Verify SMTP connection status
   * STRICT: Connected should only be verified and returned when both mail/user and password are provided and stored!
   */
  async verifyConnection(customConfig = null) {
    const settings = await Setting.getGlobal();

    // Resolve effective user and pass (fallback to database if password wasn't retyped)
    let user = (customConfig?.user !== undefined ? customConfig.user : settings.smtp?.user) || '';
    let pass = (customConfig?.pass !== undefined && customConfig?.pass !== '••••••••' ? customConfig.pass : settings.smtp?.pass) || '';
    user = (user || '').trim();
    pass = (pass || '').trim();

    // STRICT CHECK: Both email and password MUST be present and stored!
    if (!user || !pass) {
      if (!customConfig) {
        await Setting.findOneAndUpdate(
          { key: 'global_settings' },
          {
            $set: {
              'smtp.status': 'UNCONFIGURED',
              'smtp.isConfigured': false,
              'smtp.lastError': 'SMTP credentials missing: Both email and password/app password must be stored.',
            },
          }
        );
      }
      return {
        success: false,
        message: 'SMTP credentials missing: Both Email and App Password must be stored before establishing a connection.',
        status: 'UNCONFIGURED',
      };
    }

    const mergedConfig = {
      host: customConfig?.host || settings.smtp?.host || 'smtp.gmail.com',
      port: Number(customConfig?.port || settings.smtp?.port) || 587,
      user,
      pass,
      secure: customConfig?.secure !== undefined ? Boolean(customConfig.secure) : Boolean(settings.smtp?.secure),
      fromName: customConfig?.fromName || settings.smtp?.fromName || 'Education Masters',
      fromEmail: customConfig?.fromEmail || settings.smtp?.fromEmail || user,
    };

    try {
      const transporter = await this.getTransporter(mergedConfig);
      await transporter.verify();

      if (!customConfig) {
        await Setting.findOneAndUpdate(
          { key: 'global_settings' },
          {
            $set: {
              'smtp.status': 'CONNECTED',
              'smtp.isConfigured': true,
              'smtp.lastTestedAt': new Date(),
              'smtp.lastError': '',
            },
          }
        );
      }

      return {
        success: true,
        message: 'SMTP connection established and verified successfully via Nodemailer!',
        status: 'CONNECTED',
      };
    } catch (err) {
      const errorMessage = err.message || 'Failed to authenticate with SMTP server';

      if (!customConfig) {
        await Setting.findOneAndUpdate(
          { key: 'global_settings' },
          {
            $set: {
              'smtp.status': 'ERROR',
              'smtp.lastTestedAt': new Date(),
              'smtp.lastError': errorMessage,
            },
          }
        );
      }

      return {
        success: false,
        message: errorMessage,
        status: 'ERROR',
        details: err.code || 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail({ to, subject = 'Education Masters - SMTP Diagnostic Test', customConfig = null }) {
    if (!to) throw new Error('Recipient email is required');

    const settings = await Setting.getGlobal();
    const config = customConfig || settings.smtp || {};
    const user = (config.user || (customConfig ? '' : settings.smtp?.user) || '').trim();
    const pass = (config.pass && config.pass !== '••••••••' ? config.pass : settings.smtp?.pass || '').trim();

    if (!user || !pass) {
      throw new Error('SMTP credentials not configured. Please store both email and app password in settings.');
    }

    const fromName = config.fromName || 'Education Masters System';
    const fromEmail = config.fromEmail || user || 'noreply@educationmasters.in';

    const mergedConfig = {
      ...(settings.smtp ? (settings.smtp.toObject ? settings.smtp.toObject() : settings.smtp) : {}),
      ...(customConfig || {}),
      user,
      pass,
    };

    const transporter = await this.getTransporter(mergedConfig);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Education Masters</h1>
          <p style="margin: 6px 0 0; opacity: 0.85; font-size: 13px;">Global SMTP Integration Diagnostic</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center;">
            <div style="font-size: 20px; margin-right: 12px;">✅</div>
            <div>
              <h3 style="margin: 0; color: #065f46; font-size: 15px; font-weight: 700;">SMTP Test Successful!</h3>
              <p style="margin: 4px 0 0; color: #047857; font-size: 12px;">Your global mail server configuration is fully operational.</p>
            </div>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            This email confirms that Education Masters can successfully dispatch transactional emails, OTP verification codes, and administrative alerts across the entire portal.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569; margin-top: 20px; background: #f8fafc; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">SMTP Host:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${config.host || 'smtp.gmail.com'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Port / Security:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${config.port || 587} (${config.secure ? 'SSL/TLS' : 'STARTTLS'})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Sender Address:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${fromName} &lt;${fromEmail}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 600;">Test Timestamp:</td>
              <td style="padding: 10px 14px; font-family: monospace;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
            </tr>
          </table>
        </div>

        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">
          &copy; ${new Date().getFullYear()} Education Masters. All rights reserved.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html: htmlContent,
      text: `Education Masters SMTP Test: Your mail server is functioning properly. Sent at: ${new Date().toISOString()}`,
    });

    // Record test dispatch in OtpLog
    await OtpLog.create({
      recipient: to,
      otp: 'DIAGNOSTIC_TEST',
      type: 'TEST',
      channel: 'EMAIL',
      status: 'DELIVERED',
      messageText: subject,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { messageId: info.messageId },
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      envelope: info.envelope,
    };
  }

  /**
   * Global send email helper used across the application
   */
  async sendEmail({ to, subject, html, text }) {
    const settings = await Setting.getGlobal();
    const config = settings.smtp || {};
    const user = (config.user || '').trim();
    const pass = (config.pass || '').trim();

    if (!user || !pass) {
      throw new Error('SMTP credentials not configured. Please store email and app password in Admin Settings.');
    }

    const fromName = config.fromName || 'Education Masters';
    const fromEmail = config.fromEmail || user || 'noreply@educationmasters.in';

    const transporter = await this.getTransporter();
    return await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>?/gm, ''),
    });
  }
}

const smtpService = new SmtpService();
export default smtpService;
