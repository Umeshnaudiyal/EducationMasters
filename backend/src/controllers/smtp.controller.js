import smtpService from '../services/smtp.service.js';

/**
 * Test SMTP connection using saved or provided credentials
 */
export const testConnection = async (req, res, next) => {
  try {
    const customConfig = req.body?.smtp || null;
    const result = await smtpService.verifyConnection(customConfig);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test diagnostic email
 */
export const sendTestEmail = async (req, res, next) => {
  try {
    const { to, customConfig } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email address is required' });
    }

    const result = await smtpService.sendTestEmail({
      to,
      customConfig: customConfig || null,
    });

    res.status(200).json({
      success: true,
      message: `Diagnostic test email sent successfully to ${to}!`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send test email',
    });
  }
};
